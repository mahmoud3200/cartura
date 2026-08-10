"use server";

import type { Refund } from "@cartura/contracts/refunds";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  managementActionFailure,
  type ManagementActionResult,
} from "@/features/management/shared/lib/action-result";
import { executeManagementRefund } from "../api/refunds-api";

export async function executeRefundAction(
  refundId: string,
): Promise<ManagementActionResult<Refund>> {
  const id = z.uuid().safeParse(refundId);

  if (!id.success) {
    return { ok: false, message: "Choose a valid refund." };
  }

  try {
    const refund = await executeManagementRefund(id.data);
    revalidatePath("/dashboard/refunds");
    return { ok: true, data: refund };
  } catch (error) {
    return managementActionFailure(error);
  }
}
