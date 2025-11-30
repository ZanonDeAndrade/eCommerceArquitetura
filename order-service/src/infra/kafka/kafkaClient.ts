import { Kafka } from "kafkajs";

const brokers = (process.env.KAFKA_BROKERS ?? "kafka:29092")
  .split(",")
  .map((broker) => broker.trim())
  .filter(Boolean);

const clientId = process.env.KAFKA_CLIENT_ID ?? "order-service";

let kafkaInstance: Kafka | null = null;

export function getKafka(): Kafka {
  if (!kafkaInstance) {
    kafkaInstance = new Kafka({ clientId, brokers });
    console.log(
      JSON.stringify({
        message: "kafka client created",
        service: clientId,
        brokers,
      }),
    );
  }

  return kafkaInstance;
}

export const kafkaConfig = {
  clientId,
  brokers,
};
