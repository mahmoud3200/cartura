import assert from "node:assert/strict";
import { test } from "node:test";

import { productSchema } from "@cartura/contracts/catalog";

import { Prisma } from "../../../generated/prisma/client.js";
import { mapProduct } from "./products.mapper.js";
import type { ProductWithRelations } from "./products.repository.js";

test("product mapper emits ordered non-null images and a numeric Decimal price", () => {
  const mapped = mapProduct(productFixture());

  assert.doesNotThrow(() => productSchema.parse(mapped));
  assert.equal(mapped.price, 19.99);
  assert.deepEqual(mapped.images.map(({ displayOrder }) => displayOrder), [0]);
  assert.equal(mapped.images[0]?.imageUrl, "https://example.com/hoodie.webp");
});

function productFixture(): ProductWithRelations {
  const createdAt = new Date("2026-08-11T09:00:00.000Z");
  const productId = "019fe859-331d-75b7-af23-55fd23031c13";
  return {
    id: productId,
    name: "Hoodie",
    slug: "hoodie",
    description: null,
    sku: "HOODIE-1",
    price: new Prisma.Decimal("19.99"),
    stockQuantity: 5,
    isDeleted: false,
    createdBy: null,
    createdAt,
    updatedAt: createdAt,
    categories: [],
    images: [
      {
        id: "019fe85d-9565-7510-bdea-082b0724bc1e",
        productId,
        mediaAssetId: "019fe86c-ddee-7561-853b-a9f2356643ed",
        imageUrl: "https://example.com/hoodie.webp",
        altText: "Hoodie",
        displayOrder: 0,
        createdAt,
        updatedAt: createdAt,
      },
    ],
  };
}
