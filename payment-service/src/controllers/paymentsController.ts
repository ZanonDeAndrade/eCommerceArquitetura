import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import axios from "axios";

const prisma = new PrismaClient();

export const listarMetodosPagamento = async (_req: Request, res: Response) => {
  const metodos = ["PIX", "Boleto", "Cartão"];
  res.status(200).json(metodos);
};

interface PaymentInput {
  method: "PIX" | "Boleto" | "Cartão";
  amount: number;
}

// Confirmar pagamento
export const confirmarPagamento = async (req: Request, res: Response) => {
  try {
    const { orderId, payments }: { orderId: number; payments: PaymentInput[] } = req.body;
    if (!orderId || !payments || payments.length === 0) return res.status(400).json({ message: "orderId e payments obrigatórios." });

    // ✅ Validar pedido via Order Service
    const orderResp = await axios.get(`http://order-service:3003/orders/${orderId}`);
    if (!orderResp.data) return res.status(404).json({ message: "Pedido não encontrado." });

    let allSuccess = true;

    for (const p of payments) {
      const success = Math.random() > 0.1; // simulação de falha
      if (!success) allSuccess = false;

      await prisma.payment.create({ data: { orderId, method: p.method, amount: p.amount, success } });
    }

    // ✅ Atualizar status do pedido via Order Service
    await axios.patch(`http://order-service:3003/orders/${orderId}/status`, { status: allSuccess ? "PAID" : "CANCELLED" });

    res.status(200).json({ message: `Pagamento ${allSuccess ? "confirmado" : "falhou"}` });
  } catch (error: any) {
    console.error("Erro ao confirmar pagamento:", error.message);
    res.status(500).json({ message: "Erro ao confirmar pagamento", error: error.message });
  }
};

// Buscar pagamentos de um pedido
export const buscarPagamentosDoPedido = async (req: Request, res: Response) => {
  try {
    const orderId = Number(req.params.orderId);
    const payments = await prisma.payment.findMany({ where: { orderId } });
    res.status(200).json(payments);
  } catch (error: any) {
    console.error("Erro ao buscar pagamentos:", error.message);
    res.status(500).json({ message: "Erro ao buscar pagamentos", error: error.message });
  }
};
