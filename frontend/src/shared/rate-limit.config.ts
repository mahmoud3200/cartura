import "server-only";

export type BffRateLimitPolicyName =
  | "coarse"
  | "read"
  | "mutation"
  | "media"
  | "checkout"
  | "privileged";

export type BffRateLimitPolicy = {
  limit: number;
  window: `${number} s` | `${number} m` | `${number} h`;
  failClosed: boolean;
};

const isProduction = process.env.NODE_ENV === "production";
const enabled = process.env.BFF_RATE_LIMIT_ENABLED !== "false";
const provider = isProduction ? "upstash" : "memory";
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim() ?? "";
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ?? "";

if (isProduction && enabled && (!upstashUrl || !upstashToken)) {
  throw new Error(
    "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required when BFF rate limiting is enabled in production",
  );
}

export const bffRateLimitConfig = {
  enabled,
  provider,
  namespace: process.env.BFF_RATE_LIMIT_NAMESPACE?.trim() || "cartura:rl:bff",
  upstash: { url: upstashUrl, token: upstashToken },
  policies: {
    coarse: { limit: 300, window: "5 m", failClosed: false },
    read: { limit: 120, window: "1 m", failClosed: false },
    mutation: { limit: 30, window: "1 m", failClosed: false },
    media: { limit: 20, window: "10 m", failClosed: true },
    checkout: { limit: 5, window: "10 m", failClosed: true },
    privileged: { limit: 10, window: "10 m", failClosed: true },
  } satisfies Record<BffRateLimitPolicyName, BffRateLimitPolicy>,
} as const;
