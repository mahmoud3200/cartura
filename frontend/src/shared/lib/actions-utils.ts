import { z } from "zod";

import { ApiError } from "@/shared/api/server-api";

import type { AuthActionState } from "../types";

export function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key);

  return value.length > 0 ? value : undefined;
}

export function validationFailure(error: z.ZodError): AuthActionState {
  return {
    ok: false,
    message: "Check the highlighted fields and try again.",
    fieldErrors: z.flattenError(error).fieldErrors,
  };
}

export function actionFailure(error: unknown): AuthActionState {
  if (error instanceof ApiError || error instanceof Error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  return {
    ok: false,
    message: "Something went wrong. Try again.",
  };
}
