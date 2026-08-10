"use server";

import { redirect } from "next/navigation";
import { registerRequestSchema } from "@cartura/contracts/auth";

import * as authApi from "../api/auth-api";
import {
  actionFailure,
  getString,
  validationFailure,
} from "@/shared/lib/actions-utils";
import type { AuthActionState } from "@/shared/types";

export async function registerAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const input = registerRequestSchema.safeParse({
    firstName: getString(formData, "firstName"),
    lastName: getString(formData, "lastName"),
    email: getString(formData, "email"),
    password: getString(formData, "password"),
  });

  if (!input.success) {
    return validationFailure(input.error);
  }

  try {
    await authApi.register(input.data);
  } catch (error) {
    return actionFailure(error);
  }

  redirect(`/auth/verify-email?email=${encodeURIComponent(input.data.email)}`);
}
