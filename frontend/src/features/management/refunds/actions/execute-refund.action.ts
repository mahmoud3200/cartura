"use server";

import type { ManagementRefund } from "@cartura/contracts/refunds";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { enforceBffRateLimit } from "@/shared/rate-limit";

import {
  managementActionFailure,
  type ManagementActionResult,
} from "@/features/management/shared/lib/action-result";
import { executeManagementRefund } from "../api/refunds-api";

export async function executeRefundAction(
  refundId: string,
): Promise<ManagementActionResult<ManagementRefund>> {
  const id = z.uuid().safeParse(refundId);

  if (!id.success) {
    return { ok: false, message: "Choose a valid refund." };
  }

  try {
    await enforceBffRateLimit("privileged");
    const refund = await executeManagementRefund(id.data);
    revalidatePath("/dashboard/refunds");
    return { ok: true, data: refund };
  } catch (error) {
    return managementActionFailure(error);
  }
}
