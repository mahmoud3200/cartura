"use server";

import { forgotPasswordRequestSchema } from "@cartura/contracts/auth";
import { redirect } from "next/navigation";

import { actionFailure, getString, validationFailure } from "@/shared/lib/actions-utils";
import type { AuthActionState } from "@/shared/types";

import * as authApi from "../api/auth-api";

export async function forgotPasswordAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const input = forgotPasswordRequestSchema.safeParse({
    email: getString(formData, "email"),
  });

  if (!input.success) return validationFailure(input.error);

  try {
    await authApi.forgotPassword(input.data);
  } catch (error) {
    return actionFailure(error);
  }

  redirect(`/auth/reset-password?email=${encodeURIComponent(input.data.email)}`);
}
