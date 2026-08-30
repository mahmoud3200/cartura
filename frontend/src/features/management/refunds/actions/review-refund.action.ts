"use server";

import {
  reviewRefundRequestSchema,
  type ManagementRefund,
  type ReviewRefundRequest,
} from "@cartura/contracts/refunds";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { enforceBffRateLimit } from "@/shared/rate-limit";

import {
  managementActionFailure,
  type ManagementActionResult,
} from "@/features/management/shared/lib/action-result";
import { reviewManagementRefund } from "../api/refunds-api";

export async function reviewRefundAction(
  refundId: string,
  input: ReviewRefundRequest,
): Promise<ManagementActionResult<ManagementRefund>> {
  const id = z.uuid().safeParse(refundId);
  const review = reviewRefundRequestSchema.safeParse(input);

  if (!id.success || !review.success) {
    return { ok: false, message: "Check the review decision and details." };
  }

  try {
    await enforceBffRateLimit("privileged");
    const refund = await reviewManagementRefund(id.data, review.data);
    revalidatePath("/dashboard/refunds");
    return { ok: true, data: refund };
  } catch (error) {
    return managementActionFailure(error);
  }
}
