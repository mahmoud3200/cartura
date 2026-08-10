"use server";

import { resetPasswordRequestSchema } from "@cartura/contracts/auth";
import { redirect } from "next/navigation";

import { actionFailure, getString, validationFailure } from "@/shared/lib/actions-utils";
import type { AuthActionState } from "@/shared/types";

import * as authApi from "../api/auth-api";

export async function resetPasswordAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const input = resetPasswordRequestSchema.safeParse({
    email: getString(formData, "email"),
    code: getString(formData, "code"),
    password: getString(formData, "password"),
  });

  if (!input.success) return validationFailure(input.error);

  try {
    await authApi.resetPassword(input.data);
  } catch (error) {
    return actionFailure(error);
  }

  redirect("/auth/login?reset=1");
}
