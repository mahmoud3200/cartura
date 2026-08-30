import type { Cart, CartItem } from "@cartura/contracts/cart";

import { Prisma } from "../../generated/prisma/client.js";
import type {
  CartItemWithProduct,
  CartWithItems,
} from "./cart.repository.js";

export function mapCart(cart: CartWithItems): Cart {
  const items = cart.items.map(mapCartItem);
  const subtotal = cart.items.reduce(
    (sum, item) => sum.plus(item.product.price.mul(item.quantity)),
    new Prisma.Decimal(0),
  );

  return {
    id: cart.id,
    userId: cart.userId,
    subtotal: subtotal.toDecimalPlaces(2).toNumber(),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    uniqueItemCount: items.length,
    createdAt: cart.createdAt.toISOString(),
    updatedAt: cart.updatedAt.toISOString(),
    items,
  };
}

function mapCartItem(item: CartItemWithProduct): CartItem {
  const unitPrice = item.product.price.toDecimalPlaces(2);
  const primaryImage = item.product.images[0];

  return {
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: unitPrice.toNumber(),
    lineTotal: unitPrice.mul(item.quantity).toDecimalPlaces(2).toNumber(),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    product: {
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      sku: item.product.sku,
      stockQuantity: item.product.stockQuantity,
      isDeleted: item.product.isDeleted,
      image: primaryImage
        ? {
            id: primaryImage.id,
            imageUrl: primaryImage.imageUrl,
            altText: primaryImage.altText,
          }
        : null,
    },
  };
}
