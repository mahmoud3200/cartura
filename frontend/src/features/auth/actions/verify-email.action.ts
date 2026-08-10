"use server";

import { verifyEmailRequestSchema } from "@cartura/contracts/auth";
import { redirect } from "next/navigation";

import { actionFailure, getString, validationFailure } from "@/shared/lib/actions-utils";
import type { AuthActionState } from "@/shared/types";

import * as authApi from "../api/auth-api";

export async function verifyEmailAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const input = verifyEmailRequestSchema.safeParse({
    email: getString(formData, "email"),
    code: getString(formData, "code"),
  });

  if (!input.success) return validationFailure(input.error);

  try {
    await authApi.verifyEmail(input.data);
  } catch (error) {
    return actionFailure(error);
  }

  redirect("/auth/login?verified=1");
}
