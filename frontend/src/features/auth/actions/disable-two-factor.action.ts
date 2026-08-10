"use server";

import { disableTwoFactorRequestSchema } from "@cartura/contracts/auth";

import { actionFailure, getString, validationFailure } from "@/shared/lib/actions-utils";
import type { AuthActionState } from "@/shared/types";

import * as authApi from "../api/auth-api";

export async function disableTwoFactorAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const input = disableTwoFactorRequestSchema.safeParse({
    password: getString(formData, "password"),
  });

  if (!input.success) return validationFailure(input.error);

  try {
    await authApi.disableTwoFactor(input.data);
    return { ok: true, message: "Two-factor authentication disabled." };
  } catch (error) {
    return actionFailure(error);
  }
}
