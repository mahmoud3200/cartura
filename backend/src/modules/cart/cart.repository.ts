import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../infrastructure/database/prisma.js";

const serializableTransactionMaxAttempts = 3;

export const cartInclude = {
  items: {
    select: {
      productId: true,
      quantity: true,
      createdAt: true,
      updatedAt: true,
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          price: true,
          stockQuantity: true,
          isDeleted: true,
          images: {
            select: {
              id: true,
              imageUrl: true,
              altText: true,
              displayOrder: true,
            },
            orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
            take: 1,
          },
        },
      },
    },
    orderBy: [{ createdAt: "asc" }, { productId: "asc" }],
  },
} satisfies Prisma.CartInclude;

export type CartWithItems = Prisma.CartGetPayload<{
  include: typeof cartInclude;
}>;
export type CartItemWithProduct = CartWithItems["items"][number];

export type CartMutationResult =
  | { outcome: "success"; cart: CartWithItems }
  | { outcome: "product_unavailable" }
  | { outcome: "insufficient_stock" }
  | { outcome: "item_not_found" }
  | { outcome: "concurrent_modification" };

export class CartRepository {
  findOrCreateByUserId(userId: string) {
    return prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: cartInclude,
    });
  }

  addItem(input: {
    userId: string;
    productId: string;
    quantity: number;
  }): Promise<CartMutationResult> {
    return runCartMutation(async (tx) => {
      const cart = await findOrCreateCart(tx, input.userId);
      const product = await findProductAvailability(tx, input.productId);

      if (!product || product.isDeleted) {
        return { outcome: "product_unavailable" };
      }

      const currentItem = await tx.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: input.productId,
          },
        },
        select: { quantity: true },
      });
      const nextQuantity = (currentItem?.quantity ?? 0) + input.quantity;

      if (nextQuantity > product.stockQuantity) {
        return { outcome: "insufficient_stock" };
      }

      await tx.cartItem.upsert({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: input.productId,
          },
        },
        update: { quantity: nextQuantity },
        create: {
          cartId: cart.id,
          productId: input.productId,
          quantity: nextQuantity,
        },
      });
      await touchCart(tx, cart.id);

      return mutationSucceeded(await loadCart(tx, cart.id));
    });
  }

  updateItem(input: {
    userId: string;
    productId: string;
    quantity: number;
  }): Promise<CartMutationResult> {
    return runCartMutation(async (tx) => {
      if (input.quantity > 0) {
        const product = await findProductAvailability(tx, input.productId);

        if (!product || product.isDeleted) {
          return { outcome: "product_unavailable" };
        }

        if (input.quantity > product.stockQuantity) {
          return { outcome: "insufficient_stock" };
        }
      }

      const cart = await findOrCreateCart(tx, input.userId);
      const mutation =
        input.quantity === 0
          ? await tx.cartItem.deleteMany({
              where: {
                cartId: cart.id,
                productId: input.productId,
              },
            })
          : await tx.cartItem.updateMany({
              where: {
                cartId: cart.id,
                productId: input.productId,
              },
              data: { quantity: input.quantity },
            });

      if (mutation.count !== 1) {
        return { outcome: "item_not_found" };
      }

      await touchCart(tx, cart.id);
      return mutationSucceeded(await loadCart(tx, cart.id));
    });
  }

  removeItem(
    userId: string,
    productId: string,
  ): Promise<CartMutationResult> {
    return runCartMutation(async (tx) => {
      const cart = await findOrCreateCart(tx, userId);
      const mutation = await tx.cartItem.deleteMany({
        where: { cartId: cart.id, productId },
      });

      if (mutation.count !== 1) {
        return { outcome: "item_not_found" };
      }

      await touchCart(tx, cart.id);
      return mutationSucceeded(await loadCart(tx, cart.id));
    });
  }

  clear(userId: string): Promise<CartMutationResult> {
    return runCartMutation(async (tx) => {
      const cart = await findOrCreateCart(tx, userId);

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
      await touchCart(tx, cart.id);

      return mutationSucceeded(await loadCart(tx, cart.id));
    });
  }
}

type TransactionOperation<T> = (
  tx: Prisma.TransactionClient,
) => Promise<T>;

async function runCartMutation<T>(
  operation: TransactionOperation<T>,
): Promise<T | { outcome: "concurrent_modification" }> {
  try {
    return await retryCartTransaction(() =>
      prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }),
    );
  } catch (error) {
    if (isSerializableConflict(error)) {
      return { outcome: "concurrent_modification" };
    }

    throw error;
  }
}

export async function retryCartTransaction<T>(
  execute: () => Promise<T>,
): Promise<T> {
  for (
    let attempt = 1;
    attempt <= serializableTransactionMaxAttempts;
    attempt += 1
  ) {
    try {
      return await execute();
    } catch (error) {
      if (
        !isSerializableConflict(error) ||
        attempt === serializableTransactionMaxAttempts
      ) {
        throw error;
      }
    }
  }

  throw new Error("Cart transaction retry loop ended unexpectedly");
}

function isSerializableConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2034"
  );
}

function findOrCreateCart(tx: Prisma.TransactionClient, userId: string) {
  return tx.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: { id: true },
  });
}

function findProductAvailability(
  tx: Prisma.TransactionClient,
  productId: string,
) {
  return tx.product.findUnique({
    where: { id: productId },
    select: {
      isDeleted: true,
      stockQuantity: true,
    },
  });
}

function touchCart(tx: Prisma.TransactionClient, cartId: string) {
  return tx.cart.update({
    where: { id: cartId },
    data: { updatedAt: new Date() },
    select: { id: true },
  });
}

function loadCart(tx: Prisma.TransactionClient, cartId: string) {
  return tx.cart.findUniqueOrThrow({
    where: { id: cartId },
    include: cartInclude,
  });
}

function mutationSucceeded(
  cart: CartWithItems,
): Extract<CartMutationResult, { outcome: "success" }> {
  return { outcome: "success", cart };
}

export const cartRepository = new CartRepository();
