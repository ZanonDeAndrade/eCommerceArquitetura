import { Request, Response, NextFunction } from "express";
import { getRedis } from "./redisClient.js";

type CacheKeyBuilder = (req: Request) => string | null;

export function cacheMiddleware(ttlSeconds: number, keyBuilder: CacheKeyBuilder) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = keyBuilder(req);
    if (!key) return next();

    try {
      const redis = getRedis();
      const cached = await redis.get(key);
      if (cached) {
        res.setHeader("X-Cache", "HIT");
        return res.json(JSON.parse(cached));
      }

      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        redis
          .set(key, JSON.stringify(body), "EX", ttlSeconds)
          .catch((err: unknown) => console.warn("Redis set error:", (err as any)?.message ?? err));
        res.setHeader("X-Cache", "MISS");
        return originalJson(body);
      };
    } catch (err: unknown) {
      console.warn("Cache middleware error:", (err as any)?.message ?? err);
    }

    return next();
  };
}

export async function invalidateCache(keys: string[]) {
  const redis = getRedis();
  if (!keys.length) return;
  try {
    await redis.del(keys);
  } catch (err: any) {
    console.warn("Cache invalidation error:", err?.message ?? err);
  }
}
