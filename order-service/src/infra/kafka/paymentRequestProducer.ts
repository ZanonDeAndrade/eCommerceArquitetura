import { randomUUID } from "crypto";
import { Producer } from "kafkajs";
import { getKafka, kafkaConfig } from "./kafkaClient.js";

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

const paymentRequestTopic = process.env.KAFKA_PAYMENT_TOPIC ?? "orders.payment.request";

let producerPromise: Promise<Producer> | null = null;

async function getProducer(): Promise<Producer> {
  if (!producerPromise) {
    const kafka = getKafka();

    producerPromise = (async () => {
      const producer = kafka.producer();
      await producer.connect();

      console.log(
        JSON.stringify({
          message: "kafka producer connected",
          topic: paymentRequestTopic,
          clientId: kafkaConfig.clientId,
        }),
      );

      process.on("exit", () => {
        producer.disconnect().catch(() => {});
      });

      return producer;
    })();
  }

  return producerPromise;
}

export async function publishPaymentRequested(event: PaymentRequestMessage): Promise<void> {
  const producer = await getProducer();

  try {
    await producer.send({
      topic: paymentRequestTopic,
      messages: [
        {
          key: event.order.id,
          value: JSON.stringify(event),
          headers: {
            "event-id": event.eventId,
          },
        },
      ],
    });

    console.log(
      JSON.stringify({
        message: "payment request published",
        topic: paymentRequestTopic,
        orderId: event.order.id,
        eventId: event.eventId,
      }),
    );
  } catch (error: any) {
    producerPromise = null;
    throw error;
  }
}

export function buildPaymentRequestMessage(payload: {
  order: PaymentRequestMessage["order"];
  payment: PaymentRequestMessage["payment"];
}): PaymentRequestMessage {
  return {
    eventId: randomUUID(),
    occurredAt: new Date().toISOString(),
    ...payload,
  };
}

export { paymentRequestTopic };
