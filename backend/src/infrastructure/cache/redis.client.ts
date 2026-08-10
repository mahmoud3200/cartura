import { Redis } from "ioredis";

import { env } from "../../config/env.js";

let client: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (!env.REDIS_CACHE_ENABLED || !env.REDIS_URL) {
    return null;
  }

  if (!client) {
    client = new Redis(env.REDIS_URL, {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });
    client.on("error", (error) => {
      console.error("Redis cache connection failed", error);
    });
  }

  return client;
}

export async function closeRedisClient(): Promise<void> {
  if (!client) {
    return;
  }

  const activeClient = client;
  client = null;

  if (activeClient.status === "wait") {
    return;
  }

  await activeClient.quit();
}
