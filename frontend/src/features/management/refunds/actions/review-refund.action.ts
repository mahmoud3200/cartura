"use server";

import {
  reviewRefundRequestSchema,
  type Refund,
  type ReviewRefundRequest,
} from "@cartura/contracts/refunds";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  managementActionFailure,
  type ManagementActionResult,
} from "@/features/management/shared/lib/action-result";
import { reviewManagementRefund } from "../api/refunds-api";

export async function reviewRefundAction(
  refundId: string,
  input: ReviewRefundRequest,
): Promise<ManagementActionResult<Refund>> {
  const id = z.uuid().safeParse(refundId);
  const review = reviewRefundRequestSchema.safeParse(input);

  if (!id.success || !review.success) {
    return { ok: false, message: "Check the review decision and details." };
  }

  try {
    const refund = await reviewManagementRefund(id.data, review.data);
    revalidatePath("/dashboard/refunds");
    return { ok: true, data: refund };
  } catch (error) {
    return managementActionFailure(error);
  }
}
