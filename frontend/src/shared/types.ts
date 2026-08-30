import type { RATE_LIMIT_EXCEEDED_CODE } from "@cartura/contracts/common";

export type ActionRateLimitMetadata = {
  code?: typeof RATE_LIMIT_EXCEEDED_CODE;
  retryAfterSeconds?: number;
};

export type AuthActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
} & ActionRateLimitMetadata;
