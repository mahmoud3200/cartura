import type { Cart } from "@cartura/contracts/cart";

import type { CartItemWithProduct, CartWithItems } from "./cart.types.js";

export function mapCart(cart: CartWithItems): Cart {
  const items = cart.items.map(mapCartItem);
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    id: cart.id,
    userId: cart.userId,
    subtotal,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    uniqueItemCount: items.length,
    createdAt: cart.createdAt.toISOString(),
    updatedAt: cart.updatedAt.toISOString(),
    items,
  };
}

function mapCartItem(item: CartItemWithProduct) {
  const unitPrice = Number(item.product.price);
  const primaryImage = item.product.images
    .slice()
    .sort((left, right) => left.displayOrder - right.displayOrder)[0];

  return {
    productId: item.productId,
    quantity: item.quantity,
    unitPrice,
    lineTotal: unitPrice * item.quantity,
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
