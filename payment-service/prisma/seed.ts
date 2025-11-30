import { processPaymentRequest } from "../dist/application/paymentProcessor.js";
import { PaymentRequestMessage } from "../dist/infra/kafka/paymentTypes.js";
import { prisma } from "../dist/prismaClient.js";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL não encontrada. Defina a variável no ambiente (docker-compose) antes de rodar o seed.");
  process.exit(1);
}

const paymentRequests: PaymentRequestMessage[] = [
  {
    eventId: "seed-payment-6753a5c9f0a5b5b7c1f00001",
    occurredAt: new Date().toISOString(),
    order: {
      id: "6753a5c9f0a5b5b7c1f00001",
      userId: 1,
      items: [
        { productId: 1, quantity: 1, subtotal: 4500 },
        { productId: 2, quantity: 2, subtotal: 300 },
      ],
      total: 4800,
    },
    payment: {
      paymentId: "6753a5c9f0a5b5b7c1f00001-payment",
      orderId: "6753a5c9f0a5b5b7c1f00001",
      userId: 1,
      method: "PIX",
      amount: 4800,
      metadata: { origin: "seed" },
    },
  },
  {
    eventId: "seed-payment-6753a5c9f0a5b5b7c1f00002",
    occurredAt: new Date().toISOString(),
    order: {
      id: "6753a5c9f0a5b5b7c1f00002",
      userId: 2,
      items: [
        { productId: 3, quantity: 1, subtotal: 350 },
        { productId: 2, quantity: 1, subtotal: 150 },
      ],
      total: 500,
    },
    payment: {
      paymentId: "6753a5c9f0a5b5b7c1f00002-payment",
      orderId: "6753a5c9f0a5b5b7c1f00002",
      userId: 2,
      method: "Cartão",
      amount: 500,
      cardNumber: "5454545454545454",
      metadata: { origin: "seed" },
    },
  },
];

async function main() {
  for (const request of paymentRequests) {
    await processPaymentRequest(request);
  }

  console.log("Seed: pagamentos criados/atualizados com idempotência.");
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed de pagamentos:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
