"use server";

import {
  confirmRefundItemReceivedRequestSchema,
  type Refund,
} from "@cartura/contracts/refunds";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  managementActionFailure,
  type ManagementActionResult,
} from "@/features/management/shared/lib/action-result";
import { confirmManagementRefundItemReceived } from "../api/refunds-api";

export async function confirmReturnReceivedAction(
  refundId: string,
  note?: string,
): Promise<ManagementActionResult<Refund>> {
  const id = z.uuid().safeParse(refundId);
  const input = confirmRefundItemReceivedRequestSchema.safeParse({ note });

  if (!id.success || !input.success) {
    return { ok: false, message: "Choose a valid return request." };
  }

  try {
    const refund = await confirmManagementRefundItemReceived(id.data, input.data);
    revalidatePath("/dashboard/refunds");
    return { ok: true, data: refund };
  } catch (error) {
    return managementActionFailure(error);
  }
}
