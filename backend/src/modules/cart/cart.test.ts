import assert from "node:assert/strict";
import { test } from "node:test";

import {
  addCartItemRequestSchema,
  cartItemParamsSchema,
} from "@cartura/contracts/cart";

import { Prisma } from "../../generated/prisma/client.js";
import { mapCart } from "./cart.mapper.js";
import {
  retryCartTransaction,
  type CartMutationResult,
  type CartRepository,
  type CartWithItems,
} from "./cart.repository.js";
import { CartService } from "./cart.service.js";

const userId = "019fe859-331d-75b7-af23-55fd23031c13";
const productId = "019fe85d-9565-7510-bdea-082b0724bc1e";

test("cart item path parameters require a UUID", () => {
  assert.equal(cartItemParamsSchema.safeParse({ productId }).success, true);
  assert.equal(
    cartItemParamsSchema.safeParse({ productId: "not-a-uuid" }).success,
    false,
  );
  assert.equal(
    cartItemParamsSchema.safeParse({ productId, unexpected: true }).success,
    false,
  );
});

test("cart quantities reject values outside PostgreSQL integer range", () => {
  assert.equal(
    addCartItemRequestSchema.safeParse({ productId, quantity: 2_147_483_647 })
      .success,
    true,
  );
  assert.equal(
    addCartItemRequestSchema.safeParse({ productId, quantity: 2_147_483_648 })
      .success,
    false,
  );
  assert.equal(
    addCartItemRequestSchema.safeParse({
      productId,
      quantity: 1,
      unexpected: true,
    }).success,
    false,
  );
});

test("serializable cart transactions retry write conflicts", async () => {
  let attempts = 0;

  const result = await retryCartTransaction(async () => {
    attempts += 1;

    if (attempts < 3) {
      throw prismaWriteConflict();
    }

    return "updated";
  });

  assert.equal(result, "updated");
  assert.equal(attempts, 3);
});

test("serializable cart transactions stop after the bounded retry count", async () => {
  let attempts = 0;

  await assert.rejects(
    retryCartTransaction(async () => {
      attempts += 1;
      throw prismaWriteConflict();
    }),
    (error: unknown) => errorCode(error) === "P2034",
  );

  assert.equal(attempts, 3);
});

test("cart mutations use one repository operation and map stock failures", async () => {
  let calls = 0;
  const repository = {
    addItem: async (input: {
      userId: string;
      productId: string;
      quantity: number;
    }) => {
      calls += 1;
      assert.deepEqual(input, { userId, productId, quantity: 2 });
      return { outcome: "insufficient_stock" } as const;
    },
  } as unknown as CartRepository;
  const service = new CartService(repository);

  await assert.rejects(
    service.addItem(userId, { productId, quantity: 2 }),
    (error: unknown) =>
      errorCode(error) === "PRODUCT_UNAVAILABLE" &&
      errorMessage(error) === "Requested quantity exceeds stock",
  );
  assert.equal(calls, 1);
});

test("cart mutation outcomes map to stable feature errors", async () => {
  const itemMissing = new CartService(
    repositoryReturning({ outcome: "item_not_found" }),
  );
  const concurrentChange = new CartService(
    repositoryReturning({ outcome: "concurrent_modification" }),
  );

  await assert.rejects(
    itemMissing.removeItem(userId, productId),
    (error: unknown) => errorCode(error) === "CART_ITEM_NOT_FOUND",
  );
  await assert.rejects(
    concurrentChange.clearCart(userId),
    (error: unknown) => errorCode(error) === "CART_CONCURRENT_MODIFICATION",
  );
});

test("cart mapper calculates line totals and subtotal with decimals", () => {
  const mapped = mapCart(cartFixture());

  assert.equal(mapped.items[0]?.unitPrice, 0.1);
  assert.equal(mapped.items[0]?.lineTotal, 0.3);
  assert.equal(mapped.items[1]?.lineTotal, 0.2);
  assert.equal(mapped.subtotal, 0.5);
});

function repositoryReturning(result: CartMutationResult): CartRepository {
  return {
    removeItem: async () => result,
    clear: async () => result,
  } as unknown as CartRepository;
}

function prismaWriteConflict(): Error & { code: string } {
  return Object.assign(new Error("write conflict"), { code: "P2034" });
}

function errorCode(error: unknown): unknown {
  return typeof error === "object" && error !== null && "code" in error
    ? error.code
    : undefined;
}

function errorMessage(error: unknown): unknown {
  return typeof error === "object" && error !== null && "message" in error
    ? error.message
    : undefined;
}

function cartFixture(): CartWithItems {
  const createdAt = new Date("2026-08-11T10:00:00.000Z");
  const updatedAt = new Date("2026-08-11T10:05:00.000Z");

  return {
    id: "019fe86c-ddee-7561-853b-a9f2356643ed",
    userId,
    createdAt,
    updatedAt,
    items: [
      {
        productId,
        quantity: 3,
        createdAt,
        updatedAt,
        product: {
          id: productId,
          name: "Decimal item",
          slug: "decimal-item",
          sku: "DECIMAL-1",
          price: new Prisma.Decimal("0.10"),
          stockQuantity: 10,
          isDeleted: false,
          images: [],
        },
      },
      {
        productId: "019fe8bb-9726-7f30-9e96-2487b5da5abf",
        quantity: 1,
        createdAt,
        updatedAt,
        product: {
          id: "019fe8bb-9726-7f30-9e96-2487b5da5abf",
          name: "Second decimal item",
          slug: "second-decimal-item",
          sku: "DECIMAL-2",
          price: new Prisma.Decimal("0.20"),
          stockQuantity: 10,
          isDeleted: false,
          images: [],
        },
      },
    ],
  };
}
