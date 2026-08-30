"use server";

import {
  createRefundRequestSchema,
  type CreateRefundRequest,
} from "@cartura/contracts/refunds";
import { revalidatePath } from "next/cache";

import { getActionRateLimitMetadata } from "@/shared/lib/action-rate-limit";
import { enforceBffRateLimit } from "@/shared/rate-limit";

import { requestCustomerReturn } from "../api/refunds-api";
import type { ReturnActionResult } from "../types";

export async function requestReturnAction(
  input: CreateRefundRequest,
): Promise<ReturnActionResult> {
  const parsed = createRefundRequestSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Choose a reason and check your note." };
  }

  try {
    await enforceBffRateLimit("privileged");
    const refund = await requestCustomerReturn(parsed.data);
    revalidatePath(`/settings/orders/${parsed.data.orderId}`);
    return { ok: true, data: refund };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "The return request could not be submitted.",
      ...getActionRateLimitMetadata(error),
    };
  }
}
