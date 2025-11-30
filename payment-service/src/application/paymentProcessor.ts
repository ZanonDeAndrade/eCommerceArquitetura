import { PaymentRequestMessage } from "../infra/kafka/paymentTypes.js";
import { prisma } from "../prismaClient.js";

type MetadataValue = Record<string, unknown> | Array<unknown> | string | number | boolean | undefined;

interface ValidatedPaymentData {
  externalId: string;
  orderId: string;
  userId: number;
  method: string;
  amount: number;
  cardNumber?: string;
  metadata?: MetadataValue;
}

function sanitizeMetadata(metadata?: Record<string, unknown>): MetadataValue {
  if (!metadata || typeof metadata !== "object") return undefined;

  try {
    const parsed = JSON.parse(JSON.stringify(metadata)) as MetadataValue;
    return parsed ?? undefined;
  } catch {
    return undefined;
  }
}

function validatePaymentEvent(event: PaymentRequestMessage): ValidatedPaymentData {
  const orderId = event.payment.orderId || event.order.id;
  if (!orderId || orderId !== event.order.id) {
    throw new Error("orderId inválido no evento de pagamento.");
  }

  const method = String(event.payment.method ?? "").trim();
  if (!method) {
    throw new Error("Método de pagamento ausente no evento.");
  }

  const amount = Number(event.payment.amount ?? event.order.total ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Valor de pagamento inválido no evento.");
  }

  const userId = Number(event.payment.userId ?? event.order.userId ?? NaN);
  if (!Number.isFinite(userId)) {
    throw new Error("userId inválido no evento de pagamento.");
  }

  const externalId = String(event.payment.paymentId ?? event.eventId ?? `${orderId}-payment`);
  const cardNumber =
    event.payment.cardNumber !== undefined && event.payment.cardNumber !== null
      ? String(event.payment.cardNumber)
      : undefined;

  return {
    externalId,
    orderId,
    userId,
    method,
    amount,
    cardNumber,
    metadata: sanitizeMetadata(event.payment.metadata),
  };
}

export async function processPaymentRequest(event: PaymentRequestMessage) {
  const data = validatePaymentEvent(event);

  const paymentRecord = {
    orderId: data.orderId,
    userId: data.userId,
    method: data.method,
    amount: data.amount,
    status: "PENDING",
    success: false,
    cardNumber: data.cardNumber,
    metadata: (data.metadata ?? undefined) as any,
    externalId: data.externalId,
  };

  const payment = await prisma.payment.upsert({
    where: { externalId: data.externalId },
    update: {
      orderId: paymentRecord.orderId,
      userId: paymentRecord.userId,
      method: paymentRecord.method,
      amount: paymentRecord.amount,
      status: paymentRecord.status,
      success: paymentRecord.success,
      cardNumber: paymentRecord.cardNumber,
      metadata: paymentRecord.metadata,
    },
    create: paymentRecord,
  });

  return payment;
}
