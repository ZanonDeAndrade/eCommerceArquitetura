import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import axios from "axios";

const prisma = new PrismaClient();

const ORDER_SERVICE_URL = process.env.ORDER_API_URL ?? "http://order-service:3000";
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL ?? "http://email-service:3000";
const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL ?? "http://users-service:3000";

const METODOS_PERMITIDOS = ["PIX", "Boleto", "Cartão"] as const;
type MetodoPagamento = (typeof METODOS_PERMITIDOS)[number];

interface PaymentInput {
  method: MetodoPagamento;
  amount: number;
}

export const listarMetodosPagamento = (_req: Request, res: Response) => {
  res.status(200).json(METODOS_PERMITIDOS);
};

export const confirmarPagamento = async (req: Request, res: Response) => {
  try {
    const { orderId, payments }: { orderId?: string; payments?: PaymentInput[] } = req.body ?? {};

    if (!orderId || !Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({ message: "orderId e payments são obrigatórios." });
    }

    for (const payment of payments) {
      if (!METODOS_PERMITIDOS.includes(payment.method)) {
        return res.status(400).json({ message: `Método de pagamento inválido: ${payment.method}` });
      }
    }

    const orderResponse = await axios.get(`${ORDER_SERVICE_URL}/orders/${orderId}`);
    const order = orderResponse.data;

    if (!order) {
      return res.status(404).json({ message: "Pedido não encontrado." });
    }

    let allSuccess = true;
    const amount = payments.reduce((total, payment) => total + payment.amount, 0);

    let customerEmail: string | null = null;

    try {
      const userResponse = await axios.get(`${USERS_SERVICE_URL}/users/${order.userId}`);
      customerEmail = userResponse.data?.email ?? null;
    } catch (err: any) {
      console.warn("Não foi possível recuperar email do usuário:", err?.message ?? err);
    }

    const creationPromises = payments.map(async (payment) => {
      const success = Math.random() > 0.1;
      if (!success) {
        allSuccess = false;
      }

      return prisma.payment.create({
        data: {
          orderId,
          method: payment.method,
          amount: payment.amount,
          success,
        },
      });
    });

    const registros = await Promise.all(creationPromises);

    await axios.patch(`${ORDER_SERVICE_URL}/orders/${orderId}/status`, {
      status: allSuccess ? "PAID" : "CANCELLED",
    });

    if (customerEmail) {
      const payload = {
        to: customerEmail,
        orderId,
        amount,
        payments,
      };

      const url = allSuccess
        ? `${EMAIL_SERVICE_URL}/emails/payment/confirmation`
        : `${EMAIL_SERVICE_URL}/emails/payment/cancellation`;

      axios
        .post(url, payload)
        .catch((err: any) => console.warn("Falha ao notificar serviço de email:", err?.message ?? err));
    }

    res.status(200).json({
      message: allSuccess ? "Pagamento confirmado." : "Pagamento falhou para ao menos uma transação.",
      payments: registros,
    });
  } catch (error: any) {
    console.error("Erro ao confirmar pagamento:", error?.message ?? error);

    if (axios.isAxiosError(error) && error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    res.status(500).json({ message: "Erro ao confirmar pagamento", error: error?.message ?? String(error) });
  }
};

export const buscarPagamentosDoPedido = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ message: "orderId é obrigatório." });
    }

    const payments = await prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(payments);
  } catch (error: any) {
    console.error("Erro ao buscar pagamentos:", error?.message ?? error);
    res.status(500).json({ message: "Erro ao buscar pagamentos", error: error?.message ?? String(error) });
  }
};
