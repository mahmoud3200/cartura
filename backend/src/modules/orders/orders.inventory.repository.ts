import { Prisma } from "../../generated/prisma/client.js";
import { conflictError } from "../../shared/errors/index.js";

export function assertAvailableItems(
  items: Array<{
    product: {
      name: string;
      isDeleted: boolean;
      stockQuantity: number;
    };
    quantity: number;
  }>,
): void {
  for (const item of items) {
    if (item.product.isDeleted) {
      throw conflictError(
        "PRODUCT_UNAVAILABLE",
        `${item.product.name} is unavailable`,
      );
    }
    if (item.product.stockQuantity < item.quantity) {
      throw conflictError(
        "INSUFFICIENT_STOCK",
        `${item.product.name} does not have enough stock`,
      );
    }
  }
}

export async function decrementStock(
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
  }>,
  tx: Prisma.TransactionClient,
): Promise<void> {
  for (const item of items) {
    const result = await tx.product.updateMany({
      where: {
        id: item.productId,
        isDeleted: false,
        stockQuantity: { gte: item.quantity },
      },
      data: { stockQuantity: { decrement: item.quantity } },
    });

    if (result.count !== 1) {
      throw conflictError(
        "INSUFFICIENT_STOCK",
        `${item.productName} does not have enough stock`,
      );
    }
  }
}

export async function restoreOrderStock(
  items: Array<{ productId: string; quantity: number }>,
  tx: Prisma.TransactionClient,
): Promise<void> {
  for (const item of items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stockQuantity: { increment: item.quantity } },
    });
  }
}
