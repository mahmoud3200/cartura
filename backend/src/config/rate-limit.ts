import { env } from "./env.js";

export type RateLimitPolicyName =
  | "coarse"
  | "read"
  | "mutation"
  | "media"
  | "checkout"
  | "privileged"
  | "webhook";

export type RateLimitPolicy = {
  limit: number;
  windowMs: number;
  failClosed: boolean;
};

export const rateLimitConfig = {
  enabled: env.RATE_LIMIT_ENABLED,
  redisPrefix: env.RATE_LIMIT_REDIS_PREFIX,
  policies: {
    coarse: { limit: 600, windowMs: 5 * 60_000, failClosed: false },
    read: { limit: 240, windowMs: 60_000, failClosed: false },
    mutation: { limit: 60, windowMs: 60_000, failClosed: false },
    media: { limit: 40, windowMs: 10 * 60_000, failClosed: true },
    checkout: { limit: 10, windowMs: 10 * 60_000, failClosed: true },
    privileged: { limit: 20, windowMs: 10 * 60_000, failClosed: true },
    webhook: { limit: 300, windowMs: 60_000, failClosed: true },
  } satisfies Record<RateLimitPolicyName, RateLimitPolicy>,
} as const;

export function getTrustProxySetting(): false | true | number | string {
  const value = env.TRUST_PROXY.trim();

  if (!value || value === "false") return false;
  if (value === "true") return true;
  if (/^\d+$/.test(value)) return Number(value);

  return value;
}
