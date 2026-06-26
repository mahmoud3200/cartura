import type {
  AddCartItemRequest,
  UpdateCartItemRequest,
} from "@cartura/contracts/cart";

import {
  cartRepository,
  type CartRepository,
} from "./cart.repository.js";
import { cartItemNotFoundError, productUnavailableError } from "./cart.errors.js";

export class CartService {
  constructor(private readonly repository: CartRepository = cartRepository) {}

  getCart(userId: string) {
    return this.repository.findOrCreateByUserId(userId);
  }

  async addItem(userId: string, input: AddCartItemRequest) {
    const cart = await this.repository.findOrCreateByUserId(userId);
    const existingQuantity =
      cart.items.find((item) => item.productId === input.productId)?.quantity ??
      0;

    await this.assertCanUseProduct(
      input.productId,
      existingQuantity + input.quantity,
    );

    return this.repository.addItem({ userId, ...input });
  }

  async updateItem(
    userId: string,
    productId: string,
    input: UpdateCartItemRequest,
  ) {
    if (input.quantity > 0) {
      await this.assertCanUseProduct(productId, input.quantity);
    }

    const cart = await this.repository.findOrCreateByUserId(userId);
    const exists = cart.items.some((item) => item.productId === productId);

    if (!exists) {
      throw cartItemNotFoundError();
    }

    return this.repository.updateItem({
      userId,
      productId,
      quantity: input.quantity,
    });
  }

  async removeItem(userId: string, productId: string) {
    const cart = await this.repository.findOrCreateByUserId(userId);
    const exists = cart.items.some((item) => item.productId === productId);

    if (!exists) {
      throw cartItemNotFoundError();
    }

    return this.repository.removeItem(userId, productId);
  }

  clearCart(userId: string) {
    return this.repository.clear(userId);
  }

  private async assertCanUseProduct(
    productId: string,
    quantity: number,
  ): Promise<void> {
    const product = await this.repository.findProductById(productId);

    if (!product || !product.isActive) {
      throw productUnavailableError();
    }

    if (product.stockQuantity < quantity) {
      throw productUnavailableError("Requested quantity exceeds stock");
    }
  }
}

export const cartService = new CartService();
