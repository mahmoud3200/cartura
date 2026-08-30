"use server";

import {
  confirmRefundItemReceivedRequestSchema,
  type ManagementRefund,
} from "@cartura/contracts/refunds";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { enforceBffRateLimit } from "@/shared/rate-limit";

import {
  managementActionFailure,
  type ManagementActionResult,
} from "@/features/management/shared/lib/action-result";
import { confirmManagementRefundItemReceived } from "../api/refunds-api";

export async function confirmReturnReceivedAction(
  refundId: string,
  note?: string,
): Promise<ManagementActionResult<ManagementRefund>> {
  const id = z.uuid().safeParse(refundId);
  const input = confirmRefundItemReceivedRequestSchema.safeParse({ note });

  if (!id.success || !input.success) {
    return { ok: false, message: "Choose a valid return request." };
  }

  try {
    await enforceBffRateLimit("privileged");
    const refund = await confirmManagementRefundItemReceived(id.data, input.data);
    revalidatePath("/dashboard/refunds");
    return { ok: true, data: refund };
  } catch (error) {
    return managementActionFailure(error);
  }
}
