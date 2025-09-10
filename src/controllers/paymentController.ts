import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const listarMetodosPagamento = async (_req: Request, res: Response) => {
  // Métodos disponíveis
  const metodos = ["PIX", "Boleto", "Cartão"];
  res.status(200).json(metodos);
};

interface PaymentInput {
  method: "PIX" | "Boleto" | "Cartão";
  amount: number;
}

// Confirmar pagamento de um pedido
export const confirmarPagamento = async (req: Request, res: Response) => {
  try {
    const { orderId, payments }: { orderId: number; payments: PaymentInput[] } = req.body;

    if (!orderId || !payments || !Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({ message: "orderId e payments são obrigatórios." });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      return res.status(404).json({ message: "Pedido não encontrado." });
    }

    let allSuccess = true;

    for (const p of payments) {
      const success = Math.random() > 0.1; // Simulação de falha (10%)
      if (!success) allSuccess = false;

      await prisma.payment.create({
        data: {
          orderId,
          method: p.method,
          amount: p.amount,
          success,
        },
      });
    }

    const status = allSuccess ? "PAID" : "CANCELLED";

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { payments: true },
    });

    res.status(200).json({
      message: `Pagamento ${allSuccess ? "confirmado" : "falhou"}, status do pedido atualizado.`,
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error("Erro ao confirmar pagamento:", error.message);
    res.status(500).json({
      message: "Erro interno ao confirmar pagamento.",
      error: error.message,
    });
  }
};

// Buscar pagamentos de um pedido
export const buscarPagamentosDoPedido = async (req: Request, res: Response) => {
  try {
    const orderId = Number(req.params.orderId);

    if (!orderId) {
      return res.status(400).json({ message: "orderId é obrigatório." });
    }

    const payments = await prisma.payment.findMany({
      where: { orderId },
    });

    res.status(200).json(payments);
  } catch (error: any) {
    console.error("Erro ao buscar pagamentos:", error.message);
    res.status(500).json({
      message: "Erro interno ao buscar pagamentos.",
      error: error.message,
    });
  }
};
