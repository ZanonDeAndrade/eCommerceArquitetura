export interface PaymentRequestMessage {
  eventId: string;
  occurredAt: string;
  order: {
    id: string;
    userId: number;
    total: number;
    items: Array<{
      productId: number;
      productName?: string;
      quantity: number;
      subtotal: number;
    }>;
  };
  payment: {
    paymentId: string;
    orderId: string;
    userId: number;
    method: string;
    amount: number;
    cardNumber?: string;
    metadata?: Record<string, unknown>;
  };
}

export const paymentRequestTopic = process.env.KAFKA_PAYMENT_TOPIC ?? "orders.payment.request";
