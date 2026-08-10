"use server";

import { sendTwoFactorOtpRequestSchema } from "@cartura/contracts/auth";

import { actionFailure, validationFailure } from "@/shared/lib/actions-utils";
import type { AuthActionState } from "@/shared/types";

import * as authApi from "../api/auth-api";

export async function sendTwoFactorOtpAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const input = sendTwoFactorOtpRequestSchema.safeParse({
    trustDevice: formData.get("trustDevice") === "on",
  });

  if (!input.success) return validationFailure(input.error);

  try {
    await authApi.sendTwoFactorOtp(input.data);
    return { ok: true, message: "Two-factor code sent." };
  } catch (error) {
    return actionFailure(error);
  }
}
