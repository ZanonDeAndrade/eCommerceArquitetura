import { Redis } from "ioredis";

const url = process.env.REDIS_URL ?? "redis://redis:6379";

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    const redis = new Redis(url);
    redis.on("error", (err: unknown) => {
      console.warn("Redis error:", (err as any)?.message ?? err);
    });
    client = redis;
  }
  return client;
}
