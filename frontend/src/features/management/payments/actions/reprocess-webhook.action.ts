"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { enforceBffRateLimit } from "@/shared/rate-limit";

import {
  managementActionFailure,
  type ManagementActionResult,
} from "@/features/management/shared/lib/action-result";
import { reprocessManagementWebhookEvent } from "../api/payments-api";

type ReprocessResult = Awaited<
  ReturnType<typeof reprocessManagementWebhookEvent>
>;

export async function reprocessWebhookAction(
  eventId: string,
): Promise<ManagementActionResult<ReprocessResult>> {
  const id = z.uuid().safeParse(eventId);

  if (!id.success) {
    return { ok: false, message: "Choose a valid webhook event." };
  }

  try {
    await enforceBffRateLimit("privileged");
    const result = await reprocessManagementWebhookEvent(id.data);
    revalidatePath("/dashboard/payments");
    return { ok: true, data: result };
  } catch (error) {
    return managementActionFailure(error);
  }
}
