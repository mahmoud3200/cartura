import { RATE_LIMIT_EXCEEDED_CODE } from "@cartura/contracts/common";

import type { ActionRateLimitMetadata } from "@/shared/types";

export function getActionRateLimitMetadata(
  error: unknown,
): ActionRateLimitMetadata {
  if (!error || typeof error !== "object") return {};

  const candidate = error as {
    code?: unknown;
    retryAfterSeconds?: unknown;
  };

  if (candidate.code !== RATE_LIMIT_EXCEEDED_CODE) return {};

  return {
    code: RATE_LIMIT_EXCEEDED_CODE,
    ...(typeof candidate.retryAfterSeconds === "number"
      ? { retryAfterSeconds: candidate.retryAfterSeconds }
      : {}),
  };
}
