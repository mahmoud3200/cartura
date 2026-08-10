import assert from "node:assert/strict";
import { test } from "node:test";

import { buildProductWhere } from "./products.repository.js";

test("product search includes assigned category names and slugs", () => {
  const where = buildProductWhere({
    page: 1,
    limit: 20,
    q: "winter",
  });

  assert.deepEqual(where, {
    isDeleted: false,
    OR: [
      { name: { contains: "winter", mode: "insensitive" } },
      { description: { contains: "winter", mode: "insensitive" } },
      { sku: { contains: "winter", mode: "insensitive" } },
      {
        categories: {
          some: {
            category: {
              isDeleted: false,
              imageAssetId: { not: null },
              imageUrl: { not: null },
              OR: [
                { name: { contains: "winter", mode: "insensitive" } },
                { slug: { contains: "winter", mode: "insensitive" } },
              ],
            },
          },
        },
      },
    ],
  });
});

test("category pages apply category scope independently of text search", () => {
  const where = buildProductWhere(
    {
      page: 1,
      limit: 20,
      minPrice: 25,
      inStock: true,
    },
    "outerwear",
  );

  assert.deepEqual(where, {
    isDeleted: false,
    categories: {
      some: {
        category: {
          slug: "outerwear",
          isDeleted: false,
          imageAssetId: { not: null },
          imageUrl: { not: null },
        },
      },
    },
    price: { gte: 25 },
    stockQuantity: { gt: 0 },
  });
});
