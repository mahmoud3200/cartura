"use server";

import { verifyTwoFactorOtpRequestSchema } from "@cartura/contracts/auth";
import { redirect } from "next/navigation";

import { setAuthSessionToken } from "@/shared/api/auth-token";
import { actionFailure, getString, validationFailure } from "@/shared/lib/actions-utils";
import type { AuthActionState } from "@/shared/types";

import * as authApi from "../api/auth-api";

export async function verifyTwoFactorOtpAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const input = verifyTwoFactorOtpRequestSchema.safeParse({
    code: getString(formData, "code"),
    trustDevice: formData.get("trustDevice") === "on",
  });

  if (!input.success) return validationFailure(input.error);

  try {
    const response = await authApi.verifyTwoFactorOtp(input.data);
    if ("token" in response) await setAuthSessionToken(response.token);
  } catch (error) {
    return actionFailure(error);
  }

  redirect("/");
}
