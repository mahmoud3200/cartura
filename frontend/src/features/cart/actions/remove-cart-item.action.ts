"use server";

import { z } from "zod";
import { enforceBffRateLimit } from "@/shared/rate-limit";

import { removeCustomerCartItem } from "../api/cart-api";
import type { CartMutationResult } from "../types";
import { cartActionFailure } from "./action-result";

export async function removeCartItemAction(
  productId: string,
): Promise<CartMutationResult> {
  const parsed = z.uuid().safeParse(productId);

  if (!parsed.success) {
    return { ok: false, message: "Choose a valid cart item." };
  }

  try {
    await enforceBffRateLimit("mutation");
    return { ok: true, data: await removeCustomerCartItem(parsed.data) };
  } catch (error) {
    return cartActionFailure(error);
  }
}
