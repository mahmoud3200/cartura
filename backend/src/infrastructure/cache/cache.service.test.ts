import assert from "node:assert/strict";
import test from "node:test";

import { CacheService } from "./cache.service.js";

class MemorylessCacheService extends CacheService {
  override async get<T>(_key: string): Promise<T | null> {
    return null;
  }

  override async set(
    _key: string,
    _value: unknown,
    _ttlSeconds?: number,
  ): Promise<void> {}
}

test("remember shares an in-flight load for the same key", async () => {
  const cache = new MemorylessCacheService();
  let loads = 0;
  const load = async () => {
    loads += 1;
    await new Promise((resolve) => setTimeout(resolve, 10));
    return { value: 42 };
  };

  const results = await Promise.all([
    cache.remember("analytics:30d", load, 60),
    cache.remember("analytics:30d", load, 60),
    cache.remember("analytics:30d", load, 60),
  ]);

  assert.equal(loads, 1);
  assert.deepEqual(results, [{ value: 42 }, { value: 42 }, { value: 42 }]);
});
