import assert from "node:assert/strict";
import { test } from "node:test";

import { categorySchema } from "@cartura/contracts/catalog";

import { mapCategory } from "./categories.mapper.js";
import type { CategoryWithLineage } from "./categories.repository.js";

test("category mapper emits required lineage and visible children", () => {
  const mapped = mapCategory(categoryFixture());

  assert.doesNotThrow(() => categorySchema.parse(mapped));
  assert.equal(mapped.parentCategoryName, "Clothing");
  assert.deepEqual(mapped.parentCategory?.map(({ name }) => name), [
    "Catalog",
    "Clothing",
  ]);
  assert.deepEqual(mapped.children.map(({ name }) => name), ["Zip Hoodies"]);
});

function categoryFixture(): CategoryWithLineage {
  const createdAt = new Date("2026-08-11T09:00:00.000Z");
  const updatedAt = new Date("2026-08-11T10:00:00.000Z");
  return {
    id: "019fe859-331d-75b7-af23-55fd23031c13",
    parentCategoryId: "019fe85d-9565-7510-bdea-082b0724bc1e",
    name: "Hoodies",
    slug: "hoodies",
    description: null,
    imageUrl: "https://example.com/hoodies.webp",
    imageAssetId: "019fe86c-ddee-7561-853b-a9f2356643ed",
    isDeleted: false,
    createdBy: null,
    createdAt,
    updatedAt,
    parent: {
      id: "019fe85d-9565-7510-bdea-082b0724bc1e",
      parentCategoryId: null,
      name: "Clothing",
      slug: "clothing",
      description: null,
      imageUrl: "https://example.com/clothing.webp",
      imageAssetId: "019fe8bb-9726-7f30-9e96-2487b5da5abf",
      isDeleted: false,
      createdBy: null,
      createdAt,
      updatedAt,
    },
    children: [
      {
        id: "019fe8d5-aecd-757f-bd2a-6b6e9fbbb80d",
        parentCategoryId: "019fe859-331d-75b7-af23-55fd23031c13",
        name: "Zip Hoodies",
        slug: "zip-hoodies",
        description: null,
        imageUrl: "https://example.com/zip-hoodies.webp",
        imageAssetId: "019fe8e8-7fbd-728b-a461-c53999272a02",
        isDeleted: false,
        createdBy: null,
        createdAt,
        updatedAt,
      },
    ],
    parentCategory: [
      {
        id: "019fe8f7-713a-7af0-a1a6-b23a23fbe704",
        name: "Catalog",
        slug: "catalog",
      },
      {
        id: "019fe85d-9565-7510-bdea-082b0724bc1e",
        name: "Clothing",
        slug: "clothing",
      },
    ],
  };
}
