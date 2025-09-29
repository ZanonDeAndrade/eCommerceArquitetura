import { Request, Response } from "express";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  jsonTransport: true,
});

const DEFAULT_FROM = process.env.MAIL_FROM ?? "no-reply@ecommerce.local";

interface PaymentEmailInput {
  to: string;
  orderId: string;
  amount: number;
  payments?: Array<{ method: string; amount: number; success?: boolean }>;
}

interface LowStockEmailInput {
  to?: string;
  productId: number;
  productName: string;
  currentStock: number;
  threshold?: number;
}

async function sendEmail(subject: string, html: string, to: string) {
  const info = await transporter.sendMail({
    from: DEFAULT_FROM,
    to,
    subject,
    html,
  });

  console.log(
    "Email simulado enviado",
    JSON.stringify(
      {
        to,
        subject,
        html,
        messageId: info.messageId,
      },
      null,
      2,
    ),
  );
}

export const enviarEmailConfirmacaoPagamento = async (req: Request, res: Response) => {
  try {
    const { to, orderId, amount, payments }: PaymentEmailInput = req.body ?? {};

    if (!to || !orderId || typeof amount !== "number") {
      return res.status(400).json({ message: "Campos to, orderId e amount são obrigatórios." });
    }

    const paymentsList = payments?.map((p) => `• ${p.method} - R$ ${p.amount.toFixed(2)}`).join("<br>") ?? "";

    await sendEmail(
      `Pagamento confirmado - Pedido ${orderId}`,
      `<p>Olá,</p>
       <p>Seu pagamento do pedido <strong>${orderId}</strong> foi confirmado com sucesso.</p>
       <p>Total: <strong>R$ ${amount.toFixed(2)}</strong></p>
       ${paymentsList ? `<p>Detalhes:</p><p>${paymentsList}</p>` : ""}
       <p>Obrigado por comprar conosco!</p>`,
      to,
    );

    res.status(202).json({ message: "Email de confirmação enviado." });
  } catch (error: any) {
    console.error("Erro ao enviar email de confirmação:", error?.message ?? error);
    res.status(500).json({ message: "Erro ao enviar email", error: error?.message ?? String(error) });
  }
};

export const enviarEmailCancelamentoPagamento = async (req: Request, res: Response) => {
  try {
    const { to, orderId, amount }: PaymentEmailInput = req.body ?? {};

    if (!to || !orderId) {
      return res.status(400).json({ message: "Campos to e orderId são obrigatórios." });
    }

    await sendEmail(
      `Pagamento não aprovado - Pedido ${orderId}`,
      `<p>Olá,</p>
       <p>Não conseguimos confirmar o pagamento do pedido <strong>${orderId}</strong>.</p>
       ${typeof amount === "number" ? `<p>Total: <strong>R$ ${amount.toFixed(2)}</strong></p>` : ""}
       <p>Por favor, tente novamente ou entre em contato com nosso suporte.</p>`,
      to,
    );

    res.status(202).json({ message: "Email de cancelamento enviado." });
  } catch (error: any) {
    console.error("Erro ao enviar email de cancelamento:", error?.message ?? error);
    res.status(500).json({ message: "Erro ao enviar email", error: error?.message ?? String(error) });
  }
};

export const enviarEmailEstoqueBaixo = async (req: Request, res: Response) => {
  try {
    const {
      to,
      productId,
      productName,
      currentStock,
      threshold = Number(process.env.LOW_STOCK_THRESHOLD ?? 5),
    }: LowStockEmailInput = req.body ?? {};

    const destinatario = to ?? process.env.SUPPLIER_EMAIL ?? "fornecedor@ecommerce.local";

    if (!productId || !productName || typeof currentStock !== "number") {
      return res.status(400).json({ message: "Campos productId, productName e currentStock são obrigatórios." });
    }

    await sendEmail(
      `Estoque baixo - Produto ${productName}`,
      `<p>Olá,</p>
       <p>O produto <strong>${productName}</strong> (ID ${productId}) está com estoque baixo.</p>
       <p>Quantidade atual: <strong>${currentStock}</strong></p>
       <p>Limite configurado: ${threshold}</p>
       <p>Considere reabastecer o estoque.</p>`,
      destinatario,
    );

    res.status(202).json({ message: "Email de estoque baixo enviado." });
  } catch (error: any) {
    console.error("Erro ao enviar email de estoque baixo:", error?.message ?? error);
    res.status(500).json({ message: "Erro ao enviar email", error: error?.message ?? String(error) });
  }
};
