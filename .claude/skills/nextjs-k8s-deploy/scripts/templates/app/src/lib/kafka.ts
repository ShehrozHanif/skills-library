import { Kafka, Producer, logLevel } from "kafkajs";

const KAFKA_BROKERS = process.env.KAFKA_BROKERS || "kafka-0.kafka.kafka.svc.cluster.local:9092";

let producer: Producer | null = null;
let connected = false;

async function getProducer(): Promise<Producer | null> {
  if (producer && connected) return producer;
  try {
    const kafka = new Kafka({
      clientId: "learnflow-frontend",
      brokers: KAFKA_BROKERS.split(","),
      logLevel: logLevel.WARN,
      retry: { retries: 2 },
      connectionTimeout: 3000,
      requestTimeout: 5000,
    });
    producer = kafka.producer();
    await producer.connect();
    connected = true;
    return producer;
  } catch {
    connected = false;
    return null;
  }
}

export type StruggleEvent = {
  event_type: "repeated_error" | "frustrated_message" | "low_quiz_score" | "stuck_time";
  user_id: number;
  user_name: string;
  topic: string;
  details: Record<string, unknown>;
  timestamp: string;
};

export async function publishStruggleEvent(event: StruggleEvent): Promise<boolean> {
  try {
    const p = await getProducer();
    if (!p) return false;
    await p.send({
      topic: "struggle",
      messages: [{ key: String(event.user_id), value: JSON.stringify(event) }],
    });
    return true;
  } catch {
    return false;
  }
}

export async function publishEvent(topic: string, key: string, value: Record<string, unknown>): Promise<boolean> {
  try {
    const p = await getProducer();
    if (!p) return false;
    await p.send({
      topic,
      messages: [{ key, value: JSON.stringify(value) }],
    });
    return true;
  } catch {
    return false;
  }
}
