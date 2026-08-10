"use server";

import {
  buyNowCheckoutRequestSchema,
  type BuyNowCheckoutRequest,
} from "@cartura/contracts/orders";

import { buyNowCheckout } from "../api/cart-api";
import type { CartActionResult } from "../types";
import { cartActionFailure } from "./action-result";
import { ApiError } from "@/shared/api/server-api";

type CheckoutResult = {
  orderId: string;
  checkoutUrl: string | null;
};

export async function buyNowAction(
  input: BuyNowCheckoutRequest,
): Promise<CartActionResult<CheckoutResult>> {
  const parsed = buyNowCheckoutRequestSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Please check your delivery details." };
  }

  try {
    const checkout = await buyNowCheckout(parsed.data);
    return { 
      ok: true, 
      data: {
        orderId: checkout.order.id,
        checkoutUrl: checkout.checkoutUrl,
      }
    };
  } catch (error) {
    // Check if it's a conflict error (checkout in progress)
    if (error instanceof ApiError && error.status === 409) {
      const data = error.payload as { error?: { code?: string; details?: { checkoutUrl?: string } } };
      if (data?.error?.code === "CHECKOUT_IN_PROGRESS" && data?.error?.details?.checkoutUrl) {
        // Idempotency match: return the existing checkout URL
        return {
          ok: true,
          data: {
            // We don't have the full order object here, but the frontend only needs checkoutUrl to redirect
            orderId: "",
            checkoutUrl: data.error.details.checkoutUrl,
          },
        };
      }
    }

    return cartActionFailure(error);
  }
}
