import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { Kafka, Producer } from "kafkajs";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL não encontrada. Defina a variável no ambiente (docker-compose) antes de rodar o seed.");
  process.exit(1);
}

const prisma = new PrismaClient();

const orders = [
  {
    id: "6753a5c9f0a5b5b7c1f00001",
    userId: 1,
    status: "PENDING",
    items: [
      { productId: 1, quantity: 1, subtotal: 4500 },
      { productId: 2, quantity: 2, subtotal: 300 },
    ],
    payment: { method: "PIX" },
  },
  {
    id: "6753a5c9f0a5b5b7c1f00002",
    userId: 2,
    status: "PENDING",
    items: [
      { productId: 3, quantity: 1, subtotal: 350 },
      { productId: 2, quantity: 1, subtotal: 150 },
    ],
    payment: { method: "Cartão", cardNumber: "5454545454545454" },
  },
];

const brokers = (process.env.KAFKA_BROKERS ?? "kafka:29092")
  .split(",")
  .map((b) => b.trim())
  .filter(Boolean);
const topic = process.env.KAFKA_PAYMENT_TOPIC ?? "orders.payment.request";
const clientId = process.env.KAFKA_CLIENT_ID ?? "order-service-seed";

let producerPromise: Promise<Producer> | null = null;
let producerInstance: Producer | null = null;

async function getProducer(): Promise<Producer> {
  if (!producerPromise) {
    const kafka = new Kafka({ clientId, brokers });
    producerPromise = (async () => {
      const producer = kafka.producer();
      await producer.connect();
      producerInstance = producer;
      return producer;
    })();
  }
  return producerPromise;
}

async function publishPaymentRequested(event: any): Promise<void> {
  const producer = await getProducer();
  await producer.send({
    topic,
    messages: [
      {
        key: event.order.id,
        value: JSON.stringify(event),
        headers: { "event-id": event.eventId },
      },
    ],
  });
}

function buildPaymentRequestMessage(payload: any) {
  return {
    eventId: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    ...payload,
  };
}

async function main() {
  for (const order of orders) {
    const total = order.items.reduce((sum, item) => sum + item.subtotal, 0);

    const savedOrder = await prisma.order.upsert({
      where: { id: order.id },
      update: {
        userId: order.userId,
        status: order.status as any,
        total,
        items: order.items,
      },
      create: {
        id: order.id,
        userId: order.userId,
        status: order.status as any,
        total,
        items: order.items,
      },
    });

    const event = buildPaymentRequestMessage({
      order: {
        id: savedOrder.id,
        userId: order.userId,
        total,
        items: order.items,
      },
      payment: {
        paymentId: `${savedOrder.id}-payment`,
        orderId: savedOrder.id,
        userId: order.userId,
        method: order.payment.method,
        amount: total,
        ...(order.payment.cardNumber ? { cardNumber: order.payment.cardNumber } : {}),
        metadata: { origin: "seed" },
      },
    });

    await publishPaymentRequested(event);
  }

  console.log("Seed: pedidos criados/atualizados e publicados no Kafka.");
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed de pedidos:", error);
    process.exit(1);
  })
  .finally(async () => {
    if (producerInstance) {
      await producerInstance.disconnect().catch(() => {});
    }
    await prisma.$disconnect();
  });
