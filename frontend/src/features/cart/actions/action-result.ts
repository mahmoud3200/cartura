import "server-only";

import { ApiError } from "@/shared/api/server-api";
import { getActionRateLimitMetadata } from "@/shared/lib/action-rate-limit";

import type { CartActionResult } from "../types";

export function cartActionFailure(error: unknown): CartActionResult<never> {
  return {
    ok: false,
    message:
      error instanceof Error
        ? error.message
        : "The cart request could not be completed.",
    requiresAuthentication: error instanceof ApiError && error.status === 401,
    ...getActionRateLimitMetadata(error),
  };
}
