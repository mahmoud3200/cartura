import assert from "node:assert/strict";
import { test } from "node:test";

import {
  listCategoriesQuerySchema,
  listProductsQuerySchema,
  updateCategoryRequestSchema,
  updateProductRequestSchema,
} from "@cartura/contracts/catalog";

test("catalog pagination accepts page fields together with domain filters", () => {
  assert.deepEqual(
    listProductsQuerySchema.parse({
      page: "2",
      limit: "25",
      q: "hoodie",
      inStock: "true",
    }),
    { page: 2, limit: 25, q: "hoodie", inStock: true },
  );
  assert.deepEqual(
    listCategoriesQuerySchema.parse({ pageSize: "12", q: "winter" }),
    { page: 1, limit: 12, q: "winter" },
  );
});

test("catalog query contracts reject unknown fields", () => {
  assert.equal(
    listProductsQuerySchema.safeParse({ page: 1, limit: 20, sort: "name" })
      .success,
    false,
  );
});

test("catalog PATCH contracts reject empty objects", () => {
  assert.equal(updateCategoryRequestSchema.safeParse({}).success, false);
  assert.equal(updateProductRequestSchema.safeParse({}).success, false);
});
