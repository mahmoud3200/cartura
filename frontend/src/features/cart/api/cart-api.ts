import "server-only";

import {
  cartDataResponseSchema,
  type AddCartItemRequest,
  type UpdateCartItemRequest,
} from "@cartura/contracts/cart";
import {
  checkoutOrderResponseSchema,
  type CheckoutOrderRequest,
  buyNowCheckoutResponseSchema,
  type BuyNowCheckoutRequest,
} from "@cartura/contracts/orders";

import { serverApiFetch } from "@/shared/api/server-api";

export async function getCustomerCart() {
  const payload = await serverApiFetch<unknown>("/api/v1/cart");
  return cartDataResponseSchema.parse(payload).data;
}

export async function addCustomerCartItem(input: AddCartItemRequest) {
  const payload = await serverApiFetch<unknown>("/api/v1/cart/items", {
    method: "POST",
    json: input,
  });

  return cartDataResponseSchema.parse(payload).data;
}

export async function updateCustomerCartItem(
  productId: string,
  input: UpdateCartItemRequest,
) {
  const payload = await serverApiFetch<unknown>(
    `/api/v1/cart/items/${encodeURIComponent(productId)}`,
    { method: "PATCH", json: input },
  );

  return cartDataResponseSchema.parse(payload).data;
}

export async function removeCustomerCartItem(productId: string) {
  const payload = await serverApiFetch<unknown>(
    `/api/v1/cart/items/${encodeURIComponent(productId)}`,
    { method: "DELETE" },
  );

  return cartDataResponseSchema.parse(payload).data;
}

export async function checkoutCustomerCart(input: CheckoutOrderRequest) {
  const payload = await serverApiFetch<unknown>("/api/v1/orders/checkout", {
    method: "POST",
    json: input,
  });

  return checkoutOrderResponseSchema.parse(payload).data;
}

export async function buyNowCheckout(input: BuyNowCheckoutRequest) {
  const payload = await serverApiFetch<unknown>("/api/v1/orders/buy-now", {
    method: "POST",
    json: input,
  });

  return buyNowCheckoutResponseSchema.parse(payload).data;
}

