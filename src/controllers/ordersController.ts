import { PrismaClient, Product, User } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

interface OrderItemInput {
  productId: number;
  quantity: number;
}

// Criar novo pedido
export const criarPedido = async (req: Request, res: Response) => {
  try {
    const { userId, items }: { userId: number; items: OrderItemInput[] } = req.body;

    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "userId e items são obrigatórios. items deve ser um array não vazio.",
      });
    }

    const user: User | null = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    let total = 0;

    const orderItems = await Promise.all(
      items.map(async (item) => {
        const { productId, quantity } = item;

        if (!productId || !quantity || quantity <= 0) {
          throw new Error("Cada item deve ter productId e quantity válidos.");
        }

        const product: Product | null = await prisma.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          throw new Error(`Produto com ID ${productId} não encontrado.`);
        }

        if (product.stock < quantity) {
          throw new Error(
            `Estoque insuficiente para o produto ${product.name}. Disponível: ${product.stock}, Solicitado: ${quantity}`
          );
        }

        total += product.price * quantity;

        return {
          product: { connect: { id: productId } }, // ✅ RELAÇÃO CORRETA
          quantity,
          subtotal: product.price * quantity,
        };
      })
    );

    const newOrder = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId,
          total,
          items: {
            create: orderItems,
          },
        },
        include: {
          user: true,
          items: { include: { product: true } },
        },
      });

      await Promise.all(
        items.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          })
        )
      );

      return createdOrder;
    });

    res.status(201).json(newOrder);
  } catch (error: any) {
    console.error("Erro ao criar pedido:", error.message);
    res.status(500).json({
      message: "Erro interno do servidor ao criar pedido.",
      error: error.message,
    });
  }
};

// Listar todos os pedidos
export const listarPedidos = async (_req: Request, res: Response) => {
  try {    
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: { select: { id: true, name: true, price: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(orders);
  } catch (error: any) {
    console.error("Erro ao listar pedidos:", error.message);
    res.status(500).json({
      message: "Erro interno do servidor ao listar pedidos.",
      error: error.message,
    });
  }
};

// Buscar pedido por ID
export const buscarPedidoPorId = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: { select: { id: true, name: true, price: true } } } },
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Pedido não encontrado." });
    }

    res.status(200).json(order);
  } catch (error: any) {
    console.error("Erro ao buscar pedido:", error.message);
    res.status(500).json({
      message: "Erro interno do servidor ao buscar pedido.",
      error: error.message,
    });
  }
};

// Buscar pedidos de um usuário
export const buscarPedidosDoUsuario = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: { include: { product: { select: { id: true, name: true, price: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(orders);
  } catch (error: any) {
    console.error("Erro ao buscar pedidos do usuário:", error.message);
    res.status(500).json({
      message: "Erro interno do servidor ao buscar pedidos do usuário.",
      error: error.message,
    });
  }
};
