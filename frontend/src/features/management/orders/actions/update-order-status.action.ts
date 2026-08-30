"use server";

import {
  updateOrderStatusRequestSchema,
  type OrderSummary,
  type UpdateOrderStatusRequest,
} from "@cartura/contracts/orders";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { enforceBffRateLimit } from "@/shared/rate-limit";

import {
  managementActionFailure,
  type ManagementActionResult,
} from "@/features/management/shared/lib/action-result";
import { updateManagementOrderStatus } from "../api/orders-api";

export async function updateOrderStatusAction(
  orderId: string,
  input: UpdateOrderStatusRequest,
): Promise<ManagementActionResult<OrderSummary>> {
  const id = z.uuid().safeParse(orderId);
  const body = updateOrderStatusRequestSchema.safeParse(input);

  if (!id.success || !body.success) {
    return { ok: false, message: "Choose a valid order status." };
  }

  try {
    await enforceBffRateLimit("privileged");
    const order = await updateManagementOrderStatus(id.data, body.data);
    revalidatePath("/dashboard/orders");
    return { ok: true, data: order };
  } catch (error) {
    return managementActionFailure(error);
  }
}
