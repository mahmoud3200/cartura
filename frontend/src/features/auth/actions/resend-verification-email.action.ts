"use server";

import { resendVerificationEmailRequestSchema } from "@cartura/contracts/auth";

import { actionFailure, getString, validationFailure } from "@/shared/lib/actions-utils";
import type { AuthActionState } from "@/shared/types";

import * as authApi from "../api/auth-api";

export async function resendVerificationEmailAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const input = resendVerificationEmailRequestSchema.safeParse({
    email: getString(formData, "email"),
  });

  if (!input.success) return validationFailure(input.error);

  try {
    await authApi.resendVerificationEmail(input.data);
    return { ok: true, message: "Verification code sent." };
  } catch (error) {
    return actionFailure(error);
  }
}
