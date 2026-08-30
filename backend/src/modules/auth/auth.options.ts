import type { BetterAuthRateLimitOptions } from "better-auth";

export const authRateLimitOptions = {
  storage: "database",
  modelName: "authRateLimit",
} satisfies BetterAuthRateLimitOptions;
