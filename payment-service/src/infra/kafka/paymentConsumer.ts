import { KafkaMessage } from "kafkajs";
import { processPaymentRequest } from "../../application/paymentProcessor.js";
import { getKafka, kafkaConfig } from "./kafkaClient.js";
import { PaymentRequestMessage, paymentRequestTopic } from "./paymentTypes.js";

const groupId = process.env.KAFKA_GROUP_ID ?? "payment-service";

let started = false;

function parseMessage(message: KafkaMessage): PaymentRequestMessage | null {
  if (!message.value) return null;

  try {
    return JSON.parse(message.value.toString()) as PaymentRequestMessage;
  } catch (error: any) {
    console.error("Falha ao converter mensagem Kafka:", error?.message ?? error);
    return null;
  }
}

export async function startPaymentConsumer(): Promise<void> {
  if (started) return;
  started = true;

  const kafka = getKafka();
  const consumer = kafka.consumer({ groupId });

  await consumer.connect();
  await consumer.subscribe({ topic: paymentRequestTopic, fromBeginning: false });

  console.log(
    JSON.stringify({
      message: "kafka consumer iniciado",
      topic: paymentRequestTopic,
      groupId,
      clientId: kafkaConfig.clientId,
    }),
  );

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const event = parseMessage(message);
      if (!event) return;

      try {
        const payment = await processPaymentRequest(event);

        console.log(
          JSON.stringify({
            message: "pedido de pagamento consumido",
            topic,
            partition,
            orderId: event.order.id,
            paymentId: payment.externalId ?? payment.id,
            eventId: event.eventId,
          }),
        );
      } catch (processingError: any) {
        console.error("Erro ao processar pagamento via Kafka:", processingError?.message ?? processingError);
        throw processingError;
      }
    },
  });

  process.on("exit", () => {
    consumer.disconnect().catch(() => {});
  });
}
