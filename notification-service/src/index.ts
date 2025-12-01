import "dotenv/config";
import { Kafka } from "kafkajs";

const brokers = (process.env.KAFKA_BROKERS ?? "kafka:29092")
  .split(",")
  .map((b) => b.trim())
  .filter(Boolean);
const topic = process.env.KAFKA_PAYMENT_TOPIC ?? "orders.payment.request";
const clientId = process.env.KAFKA_CLIENT_ID ?? "notification-service";
const groupId = process.env.KAFKA_GROUP_ID ?? "notification-service";

async function start() {
  const kafka = new Kafka({ clientId, brokers });
  const consumer = kafka.consumer({ groupId });

  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: false });

  console.log(`Notification service consuming ${topic}`);

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      try {
        const event = JSON.parse(message.value.toString());
        console.log(JSON.stringify({ message: "notification received", eventId: event.eventId, orderId: event.order?.id }));
      } catch (err: any) {
        console.warn("Failed to parse notification event:", err?.message ?? err);
      }
    },
  });

  process.on("SIGTERM", () => consumer.disconnect().catch(() => {}));
}

start().catch((err) => {
  console.error("Notification service failed to start:", err?.message ?? err);
  process.exit(1);
});
