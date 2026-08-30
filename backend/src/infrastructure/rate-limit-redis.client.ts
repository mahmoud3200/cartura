import { Redis } from "ioredis";

import { env } from "../config/env.js";

const shouldUseRedis =
  env.NODE_ENV === "production" && env.RATE_LIMIT_ENABLED;

export const rateLimitRedisClient = shouldUseRedis
  ? new Redis(env.REDIS_URL, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    })
  : null;

rateLimitRedisClient?.on("error", (error) => {
  console.error("Rate-limit Redis connection failed", error.message);
});

export async function connectRateLimitRedis(): Promise<void> {
  if (!rateLimitRedisClient || rateLimitRedisClient.status === "ready") return;

  await rateLimitRedisClient.connect();
  await rateLimitRedisClient.ping();
}

export async function closeRateLimitRedis(): Promise<void> {
  if (!rateLimitRedisClient) return;

  if (rateLimitRedisClient.status === "ready") {
    await rateLimitRedisClient.quit();
    return;
  }

  rateLimitRedisClient.disconnect();
}
