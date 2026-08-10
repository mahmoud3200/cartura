import { env } from "../../config/env.js";
import { getRedisClient } from "./redis.client.js";

export class CacheService {
  private readonly pendingLoads = new Map<string, Promise<unknown>>();

  async get<T>(key: string): Promise<T | null> {
    const client = getRedisClient();

    if (!client) {
      return null;
    }

    try {
      const value = await client.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch {
      return null;
    }
  }

  async set(
    key: string,
    value: unknown,
    ttlSeconds = env.REDIS_CACHE_TTL_SECONDS,
  ): Promise<void> {
    const client = getRedisClient();

    if (!client) {
      return;
    }

    try {
      await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch {
      // Cache failures must not make the source-of-truth request fail.
    }
  }

  async remember<T>(
    key: string,
    load: () => Promise<T>,
    ttlSeconds = env.REDIS_CACHE_TTL_SECONDS,
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const pendingLoad = this.pendingLoads.get(key) as Promise<T> | undefined;

    if (pendingLoad) {
      return pendingLoad;
    }

    const loadPromise = (async () => {
      const value = await load();
      await this.set(key, value, ttlSeconds);
      return value;
    })();

    this.pendingLoads.set(key, loadPromise);

    try {
      return await loadPromise;
    } finally {
      if (this.pendingLoads.get(key) === loadPromise) {
        this.pendingLoads.delete(key);
      }
    }
  }

  async delete(key: string): Promise<void> {
    const client = getRedisClient();

    if (!client) {
      return;
    }

    try {
      await client.del(key);
    } catch {
      // Cache invalidation is best-effort; authorization still reads from DB on miss.
    }
  }

  async deleteByPattern(pattern: string): Promise<void> {
    const client = getRedisClient();

    if (!client) {
      return;
    }

    try {
      let cursor = "0";

      do {
        const [nextCursor, keys] = await client.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100,
        );
        cursor = nextCursor;

        if (keys.length > 0) {
          await client.del(...keys);
        }
      } while (cursor !== "0");
    } catch {
      // Cache invalidation is best-effort; entries also have a short TTL.
    }
  }
}

export const cacheService = new CacheService();
