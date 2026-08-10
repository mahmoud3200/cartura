"use server";

import { updateCartItemRequestSchema } from "@cartura/contracts/cart";
import { z } from "zod";

import { updateCustomerCartItem } from "../api/cart-api";
import type { CartMutationResult } from "../types";
import { cartActionFailure } from "./action-result";

const inputSchema = z.object({
  productId: z.uuid(),
  quantity: updateCartItemRequestSchema.shape.quantity,
});

export async function updateCartItemAction(
  input: z.input<typeof inputSchema>,
): Promise<CartMutationResult> {
  const parsed = inputSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Choose a valid item quantity." };
  }

  try {
    return {
      ok: true,
      data: await updateCustomerCartItem(parsed.data.productId, {
        quantity: parsed.data.quantity,
      }),
    };
  } catch (error) {
    return cartActionFailure(error);
  }
}

