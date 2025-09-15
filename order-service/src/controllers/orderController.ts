import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import axios from "axios";

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
      return res.status(400).json({ message: "userId e items são obrigatórios." });
    }

    // ✅ Validar usuário via User Service
    const userResp = await axios.get(`http://user-service:3001/users/${userId}`);
    if (!userResp.data) return res.status(404).json({ message: "Usuário não encontrado." });

    let total = 0;
    const orderItems = await Promise.all(items.map(async (item) => {
      // ✅ Validar produto via Product Service
      const prodResp = await axios.get(`http://product-service:3002/products/${item.productId}`);
      const product = prodResp.data;
      if (!product) throw new Error(`Produto ${item.productId} não encontrado`);
      if (product.stock < item.quantity) throw new Error(`Estoque insuficiente para ${product.name}`);

      total += product.price * item.quantity;

      // ✅ Atualizar estoque via Product Service
      await axios.patch(`http://product-service:3002/products/${item.productId}/decrement-stock`, { quantity: item.quantity });

      return {
        productId: item.productId,
        quantity: item.quantity,
        subtotal: product.price * item.quantity,
      };
    }));

    const newOrder = await prisma.order.create({
      data: { userId, total, items: { create: orderItems } },
      include: { items: true },
    });

    res.status(201).json(newOrder);
  } catch (error: any) {
    console.error("Erro ao criar pedido:", error.message);
    res.status(500).json({ message: "Erro ao criar pedido", error: error.message });
  }
};

// Listar pedidos
export const listarPedidos = async (_req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" } });
    res.status(200).json(orders);
  } catch (error: any) {
    console.error("Erro ao listar pedidos:", error.message);
    res.status(500).json({ message: "Erro ao listar pedidos", error: error.message });
  }
};

// Buscar pedido por ID
export const buscarPedidoPorId = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) return res.status(404).json({ message: "Pedido não encontrado." });
    res.status(200).json(order);
  } catch (error: any) {
    console.error("Erro ao buscar pedido:", error.message);
    res.status(500).json({ message: "Erro ao buscar pedido", error: error.message });
  }
};

// Buscar pedidos de um usuário
export const buscarPedidosDoUsuario = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    const orders = await prisma.order.findMany({ where: { userId }, include: { items: true }, orderBy: { createdAt: "desc" } });
    res.status(200).json(orders);
  } catch (error: any) {
    console.error("Erro ao buscar pedidos do usuário:", error.message);
    res.status(500).json({ message: "Erro ao buscar pedidos do usuário", error: error.message });
  }
};
