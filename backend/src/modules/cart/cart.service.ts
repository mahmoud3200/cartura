import type {
  AddCartItemRequest,
  UpdateCartItemRequest,
} from "@cartura/contracts/cart";

import {
  cartRepository,
  type CartMutationResult,
  type CartRepository,
  type CartWithItems,
} from "./cart.repository.js";
import {
  cartConcurrentModificationError,
  cartItemNotFoundError,
  productUnavailableError,
} from "./cart.errors.js";

export class CartService {
  constructor(private readonly repository: CartRepository = cartRepository) {}

  getCart(userId: string) {
    return this.repository.findOrCreateByUserId(userId);
  }

  async addItem(userId: string, input: AddCartItemRequest) {
    return resolveCartMutation(
      await this.repository.addItem({
        userId,
        productId: input.productId,
        quantity: input.quantity,
      }),
    );
  }

  async updateItem(
    userId: string,
    productId: string,
    input: UpdateCartItemRequest,
  ) {
    return resolveCartMutation(
      await this.repository.updateItem({
        userId,
        productId,
        quantity: input.quantity,
      }),
    );
  }

  async removeItem(userId: string, productId: string) {
    return resolveCartMutation(
      await this.repository.removeItem(userId, productId),
    );
  }

  async clearCart(userId: string) {
    return resolveCartMutation(await this.repository.clear(userId));
  }
}

function resolveCartMutation(result: CartMutationResult): CartWithItems {
  switch (result.outcome) {
    case "success":
      return result.cart;
    case "product_unavailable":
      throw productUnavailableError();
    case "insufficient_stock":
      throw productUnavailableError("Requested quantity exceeds stock");
    case "item_not_found":
      throw cartItemNotFoundError();
    case "concurrent_modification":
      throw cartConcurrentModificationError();
  }
}

export const cartService = new CartService();
