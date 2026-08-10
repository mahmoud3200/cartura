"use server";

import {
  checkoutOrderRequestSchema,
  type CheckoutOrderRequest,
} from "@cartura/contracts/orders";

import { ApiError } from "@/shared/api/server-api";

import { checkoutCustomerCart } from "../api/cart-api";
import type { CartActionResult } from "../types";
import { cartActionFailure } from "./action-result";

type CheckoutResult = {
  orderId: string;
  checkoutUrl: string | null;
};

export async function checkoutCartAction(
  input: CheckoutOrderRequest,
): Promise<CartActionResult<CheckoutResult>> {
  const parsed = checkoutOrderRequestSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Choose a delivery address and try again." };
  }

  try {
    const checkout = await checkoutCustomerCart(parsed.data);

    return {
      ok: true,
      data: {
        orderId: checkout.order.id,
        checkoutUrl: checkout.checkoutUrl,
      },
    };
  } catch (error) {
    const providerMessage = getPaymobProviderMessage(error);

    if (providerMessage) {
      return {
        ok: false,
        message: `Paymob could not start payment: ${providerMessage}`,
      };
    }

    if (error instanceof ApiError && error.status === 409) {
      const data = error.payload as { error?: { code?: string; details?: { checkoutUrl?: string } } };
      if (data?.error?.code === "CHECKOUT_IN_PROGRESS" && data?.error?.details?.checkoutUrl) {
        return {
          ok: true,
          data: {
            orderId: "", // We don't have this, but redirect only needs URL
            checkoutUrl: data.error.details.checkoutUrl,
          },
        };
      }
    }

    return cartActionFailure(error);
  }
}

function getPaymobProviderMessage(error: unknown): string | null {
  if (!(error instanceof ApiError) || !isRecord(error.payload)) {
    return null;
  }

  const apiError = isRecord(error.payload.error) ? error.payload.error : null;

  if (!apiError || apiError.code !== "PAYMOB_INTENTION_FAILED") {
    return null;
  }

  return findFirstMessage(apiError.details) ?? "check your Paymob credentials and card integration ID.";
}

function findFirstMessage(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim().slice(0, 240);
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const message = findFirstMessage(entry);

      if (message) return message;
    }
  }

  if (isRecord(value)) {
    for (const entry of Object.values(value)) {
      const message = findFirstMessage(entry);

      if (message) return message;
    }
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
