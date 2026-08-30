import assert from "node:assert/strict";
import test from "node:test";

import { paginatedQuerySchema } from "@cartura/contracts/common";
import { z } from "zod";

const filteredQuerySchema = paginatedQuerySchema({
  q: z.string().trim().min(1).optional(),
});

test("paginated query validates pagination and feature filters together", () => {
  assert.deepEqual(
    filteredQuerySchema.parse({ page: "2", limit: "10", q: " shoes " }),
    { page: 2, limit: 10, q: "shoes" },
  );
});

test("paginated query accepts pageSize as a backwards-compatible alias", () => {
  assert.deepEqual(filteredQuerySchema.parse({ pageSize: "5" }), {
    page: 1,
    limit: 5,
  });
});

test("paginated query rejects unrelated keys", () => {
  assert.throws(() => filteredQuerySchema.parse({ unexpected: "value" }));
});
