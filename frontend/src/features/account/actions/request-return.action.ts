"use server";

import {
  createRefundRequestSchema,
  type CreateRefundRequest,
  type Refund,
} from "@cartura/contracts/refunds";
import { revalidatePath } from "next/cache";

import { requestCustomerReturn } from "../api/refunds-api";

type ReturnActionResult =
  | { ok: true; data: Refund }
  | { ok: false; message: string };

export async function requestReturnAction(
  input: CreateRefundRequest,
): Promise<ReturnActionResult> {
  const parsed = createRefundRequestSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Choose a reason and check your note." };
  }

  try {
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
    };
  }
}
