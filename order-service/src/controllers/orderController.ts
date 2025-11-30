import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import axios from "axios";
import {
  PaymentRequestMessage,
  buildPaymentRequestMessage,
  paymentRequestTopic,
  publishPaymentRequested,
} from "../infra/kafka/paymentRequestProducer.js";

const prisma = new PrismaClient();

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL ?? "http://users-service:3000";
const PRODUCTS_SERVICE_URL = process.env.PRODUCTS_SERVICE_URL ?? "http://products-service:3000";

const ORDER_STATUS = ["PENDING", "FAILED", "PAID", "CANCELLED"] as const;
type OrderStatusValue = (typeof ORDER_STATUS)[number];

interface OrderItemInput {
  productId: number;
  quantity: number;
}

interface OrderItemOutput {
  productId: number;
  quantity: number;
  subtotal: number;
  productName?: string;
}

type RawPaymentInput = Record<string, unknown> | undefined;

async function revertStockAdjustments(adjustments: { productId: number; quantity: number }[]): Promise<void> {
  if (!adjustments.length) return;

  await Promise.allSettled(
    adjustments.map((item) =>
      axios.patch(`${PRODUCTS_SERVICE_URL}/products/${item.productId}/stock`, {
        stock: item.quantity,
      }),
    ),
  );
}

interface NormalizedPaymentInput {
  paymentId?: string;
  method: string;
  amount: number;
  cardNumber?: string;
  metadata?: Record<string, unknown>;
}

function normalizePaymentInput(rawPayment: RawPaymentInput, total: number): NormalizedPaymentInput {
  const paymentData = rawPayment && typeof rawPayment === "object" ? rawPayment : {};
  const method = String((paymentData as Record<string, unknown>).method ?? "PIX").trim();
  if (!method) {
    throw new Error("Método de pagamento inválido.");
  }

  const amount = Number((paymentData as Record<string, unknown>).amount ?? total);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Valor do pagamento inválido.");
  }

  const cardNumberValue = (paymentData as Record<string, unknown>).cardNumber;
  const cardNumber =
    cardNumberValue !== undefined && cardNumberValue !== null ? String(cardNumberValue).trim() : undefined;

  const { method: _m, amount: _a, cardNumber: _c, paymentId, ...rest } = paymentData as Record<string, unknown>;
  const metadataEntries = Object.entries(rest).filter(([, value]) => value !== undefined);
  const metadata = metadataEntries.length ? Object.fromEntries(metadataEntries) : undefined;

  return {
    paymentId: typeof paymentId === "string" && paymentId.trim().length ? paymentId : undefined,
    method,
    amount,
    cardNumber,
    metadata,
  };
}

export const criarPedido = async (req: Request, res: Response) => {
  const stockAdjustments: { productId: number; quantity: number }[] = [];
  let createdOrderId: string | null = null;

  try {
    const { userId, items, payment, payments }: { userId: number; items: OrderItemInput[]; payment?: unknown; payments?: unknown[] } =
      req.body ?? {};

    if (!userId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "userId e items são obrigatórios." });
    }

    const paymentPayload: RawPaymentInput =
      (payment as RawPaymentInput) ?? (Array.isArray(payments) ? (payments[0] as RawPaymentInput) : undefined);

    // Valida usuário no serviço de usuários
    const userResponse = await axios.get(`${USERS_SERVICE_URL}/users/${userId}`);

    if (!userResponse.data) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    let total = 0;

    const orderItems: OrderItemOutput[] = [];

    for (const item of items) {
      const productResponse = await axios.get(`${PRODUCTS_SERVICE_URL}/products/${item.productId}`);
      const product = productResponse.data;

      if (!product) {
        return res.status(404).json({ message: `Produto ${item.productId} não encontrado.` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Estoque insuficiente para o produto ${product.name}.` });
      }

      const subtotal = product.price * item.quantity;
      total += subtotal;

      await axios.patch(`${PRODUCTS_SERVICE_URL}/products/${item.productId}/stock`, {
        stock: -item.quantity,
      });
      stockAdjustments.push({ productId: item.productId, quantity: item.quantity });

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        subtotal,
        productName: product.name,
      });
    }

    let normalizedPayment: NormalizedPaymentInput;
    try {
      normalizedPayment = normalizePaymentInput(paymentPayload, total);
    } catch (validationError: any) {
      return res.status(400).json({
        message: validationError?.message ?? "Pagamento inválido.",
      });
    }

    const newOrder = await prisma.order.create({
      data: {
        userId,
        total,
        items: orderItems.map(({ productId, quantity, subtotal }) => ({ productId, quantity, subtotal })),
      },
    });
    createdOrderId = newOrder.id;

    const paymentMessage: PaymentRequestMessage["payment"] = {
      paymentId: normalizedPayment.paymentId ?? `${newOrder.id}-payment`,
      orderId: newOrder.id,
      userId,
      method: normalizedPayment.method,
      amount: normalizedPayment.amount,
      ...(normalizedPayment.cardNumber ? { cardNumber: normalizedPayment.cardNumber } : {}),
      ...(normalizedPayment.metadata ? { metadata: normalizedPayment.metadata } : {}),
    };

    const kafkaEvent = buildPaymentRequestMessage({
      order: {
        id: newOrder.id,
        userId,
        total,
        items: orderItems,
      },
      payment: paymentMessage,
    });

    try {
      await publishPaymentRequested(kafkaEvent);
    } catch (kafkaError: any) {
      await prisma.order.update({ where: { id: newOrder.id }, data: { status: "FAILED" } }).catch(() => {});
      await revertStockAdjustments(stockAdjustments);
      console.error("Erro ao publicar evento no Kafka:", kafkaError?.message ?? kafkaError);

      return res.status(502).json({
        message: "Falha ao enfileirar pedido para pagamento no Kafka.",
        error: kafkaError?.message ?? String(kafkaError),
      });
    }

    console.log(
      JSON.stringify({
        message: "pedido criado e enviado para pagamento",
        orderId: newOrder.id,
        topic: paymentRequestTopic,
        total,
      }),
    );

    res.status(201).json(newOrder);
  } catch (error: any) {
    console.error("Erro ao criar pedido:", error?.message ?? error);

    if (createdOrderId) {
      await prisma.order.update({ where: { id: createdOrderId }, data: { status: "FAILED" } }).catch(() => {});
    }

    if (stockAdjustments.length) {
      await revertStockAdjustments(stockAdjustments);
    }

    if (axios.isAxiosError(error) && error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    res.status(500).json({ message: "Erro ao criar pedido", error: error?.message ?? String(error) });
  }
};

export const listarPedidos = async (_req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });
    res.status(200).json(orders);
  } catch (error: any) {
    console.error("Erro ao listar pedidos:", error?.message ?? error);
    res.status(500).json({ message: "Erro ao listar pedidos", error: error?.message ?? String(error) });
  }
};

export const buscarPedidoPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      return res.status(404).json({ message: "Pedido não encontrado." });
    }

    res.status(200).json(order);
  } catch (error: any) {
    console.error("Erro ao buscar pedido:", error?.message ?? error);
    res.status(500).json({ message: "Erro ao buscar pedido", error: error?.message ?? String(error) });
  }
};

export const buscarPedidosDoUsuario = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);

    if (Number.isNaN(userId)) {
      return res.status(400).json({ message: "userId inválido." });
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(orders);
  } catch (error: any) {
    console.error("Erro ao buscar pedidos do usuário:", error?.message ?? error);
    res.status(500).json({ message: "Erro ao buscar pedidos do usuário", error: error?.message ?? String(error) });
  }
};

export const atualizarStatusPedido = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status?: OrderStatusValue };

    if (!status || !ORDER_STATUS.includes(status)) {
      return res.status(400).json({ message: "Status inválido." });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
    });

    res.status(200).json(updatedOrder);
  } catch (error: any) {
    console.error("Erro ao atualizar status do pedido:", error?.message ?? error);

    if (error?.code === "P2025") {
      return res.status(404).json({ message: "Pedido não encontrado." });
    }

    res.status(500).json({ message: "Erro ao atualizar status do pedido", error: error?.message ?? String(error) });
  }
};
