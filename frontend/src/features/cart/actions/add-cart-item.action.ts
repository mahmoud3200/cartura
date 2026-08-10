"use server";

import {
  addCartItemRequestSchema,
  type AddCartItemRequest,
} from "@cartura/contracts/cart";

import { addCustomerCartItem } from "../api/cart-api";
import type { CartMutationResult } from "../types";
import { cartActionFailure } from "./action-result";

export async function addCartItemAction(
  input: AddCartItemRequest,
): Promise<CartMutationResult> {
  const parsed = addCartItemRequestSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Choose a valid item quantity." };
  }

  try {
    return { ok: true, data: await addCustomerCartItem(parsed.data) };
  } catch (error) {
    return cartActionFailure(error);
  }
}

