"use server";

import { redirect } from "next/navigation";
import { loginRequestSchema } from "@cartura/contracts/auth";

import { setAuthSessionToken } from "@/shared/api/auth-token";

import * as authApi from "../api/auth-api";
import { getSafeInternalRedirect } from "../lib/auth-redirects";
import {
  actionFailure,
  getString,
  validationFailure,
} from "@/shared/lib/actions-utils";
import type { AuthActionState } from "@/shared/types";

export async function loginAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const input = loginRequestSchema.safeParse({
    email: getString(formData, "email"),
    password: getString(formData, "password"),
    rememberMe: formData.get("rememberMe") === "on",
  });

  if (!input.success) {
    return validationFailure(input.error);
  }

  const requestedDestination = getString(formData, "redirectTo");
  let destination = getSafeInternalRedirect(requestedDestination);

  try {
    const response = await authApi.login(input.data);

    if ("twoFactorRedirect" in response) {
      destination = "/auth/two-factor";
    } else {
      await setAuthSessionToken(response.token);
    }
  } catch (error) {
    return actionFailure(error);
  }

  redirect(destination);
}
