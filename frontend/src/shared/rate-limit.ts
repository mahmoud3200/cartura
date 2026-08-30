import "server-only";

import { createHash } from "node:crypto";
import { isIP } from "node:net";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { RATE_LIMIT_EXCEEDED_CODE } from "@cartura/contracts/common";
import { headers } from "next/headers";

import { getAuthSessionToken } from "@/shared/api/auth-token";

import {
  bffRateLimitConfig,
  type BffRateLimitPolicy,
  type BffRateLimitPolicyName,
} from "./rate-limit.config";

type LimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  unavailable?: boolean;
};

type MemoryEntry = { count: number; reset: number };

const memoryCounters = new Map<string, MemoryEntry>();
const upstashRedis =
  bffRateLimitConfig.provider === "upstash"
    ? new Redis(bffRateLimitConfig.upstash)
    : null;
const limiters = new Map<BffRateLimitPolicyName, Ratelimit>();

export class BffRateLimitError extends Error {
  readonly code = RATE_LIMIT_EXCEEDED_CODE;

  constructor(
    public readonly retryAfterSeconds: number,
    public readonly limit: number,
    public readonly remaining: number,
  ) {
    super(`Too many requests. Try again in ${retryAfterSeconds} seconds.`);
    this.name = "BffRateLimitError";
  }
}

export class BffRateLimitUnavailableError extends Error {
  readonly status = 503;

  constructor() {
    super("This operation is temporarily unavailable. Try again shortly.");
    this.name = "BffRateLimitUnavailableError";
  }
}

export async function enforceBffRateLimit(
  policyName: Exclude<BffRateLimitPolicyName, "coarse">,
): Promise<void> {
  if (!bffRateLimitConfig.enabled) return;

  const requestHeaders = await headers();
  const clientIp = getTrustedClientIp(requestHeaders);
  const sessionToken = await getAuthSessionToken();
  const coarseIdentifier = hashIdentifier(`ip:${clientIp}`);
  const policyIdentifier = sessionToken
    ? hashIdentifier(`session:${sessionToken}`)
    : coarseIdentifier;

  await consume("coarse", coarseIdentifier);
  await consume(policyName, policyIdentifier);
}

export function createRateLimitResponse(error: BffRateLimitError): Response {
  const reset = Math.ceil(Date.now() / 1000) + error.retryAfterSeconds;

  return Response.json(
    {
      error: {
        code: RATE_LIMIT_EXCEEDED_CODE,
        message: error.message,
      },
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(error.retryAfterSeconds),
        RateLimit: `limit=${error.limit}, remaining=${error.remaining}, reset=${reset}`,
      },
    },
  );
}

export async function withBffRateLimitResponse(
  policyName: Exclude<BffRateLimitPolicyName, "coarse">,
  operation: () => Response | Promise<Response>,
): Promise<Response> {
  try {
    await enforceBffRateLimit(policyName);
    return await operation();
  } catch (error) {
    if (error instanceof BffRateLimitError) {
      return createRateLimitResponse(error);
    }

    if (error instanceof BffRateLimitUnavailableError) {
      return Response.json(
        {
          error: {
            code: "RATE_LIMIT_UNAVAILABLE",
            message: error.message,
          },
        },
        { status: 503 },
      );
    }

    throw error;
  }
}

async function consume(
  policyName: BffRateLimitPolicyName,
  identifier: string,
): Promise<void> {
  const policy = bffRateLimitConfig.policies[policyName];

  try {
    const result = await limit(policyName, policy, identifier);

    if (result.unavailable) {
      handleStoreFailure(policyName, policy);
      return;
    }

    if (result.success) return;

    throw new BffRateLimitError(
      Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
      result.limit,
      result.remaining,
    );
  } catch (error) {
    if (error instanceof BffRateLimitError) throw error;

    console.error("BFF rate-limit store failure", { policy: policyName, error });
    handleStoreFailure(policyName, policy);
  }
}

function handleStoreFailure(
  policyName: BffRateLimitPolicyName,
  policy: BffRateLimitPolicy,
): void {
  if (policy.failClosed) throw new BffRateLimitUnavailableError();

  console.warn("BFF rate limit failed open", { policy: policyName });
}

async function limit(
  policyName: BffRateLimitPolicyName,
  policy: BffRateLimitPolicy,
  identifier: string,
): Promise<LimitResult> {
  if (!upstashRedis) {
    return limitInMemory(policyName, policy, identifier);
  }

  let limiter = limiters.get(policyName);

  if (!limiter) {
    limiter = new Ratelimit({
      redis: upstashRedis,
      limiter: Ratelimit.slidingWindow(policy.limit, policy.window),
      prefix: `${bffRateLimitConfig.namespace}:${policyName}`,
      analytics: false,
      timeout: 2_000,
    });
    limiters.set(policyName, limiter);
  }

  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    unavailable: result.reason === "timeout",
  };
}

function limitInMemory(
  policyName: BffRateLimitPolicyName,
  policy: BffRateLimitPolicy,
  identifier: string,
): LimitResult {
  const now = Date.now();
  const windowMs = parseWindowMs(policy.window);
  const key = `${policyName}:${identifier}`;
  const existing = memoryCounters.get(key);
  const entry = !existing || existing.reset <= now
    ? { count: 0, reset: now + windowMs }
    : existing;

  entry.count += 1;
  memoryCounters.set(key, entry);

  return {
    success: entry.count <= policy.limit,
    limit: policy.limit,
    remaining: Math.max(0, policy.limit - entry.count),
    reset: entry.reset,
  };
}

function parseWindowMs(window: BffRateLimitPolicy["window"]): number {
  const [amount, unit] = window.split(" ") as [string, "s" | "m" | "h"];
  const multiplier = unit === "h" ? 3_600_000 : unit === "m" ? 60_000 : 1_000;

  return Number(amount) * multiplier;
}

function getTrustedClientIp(requestHeaders: Headers): string {
  const candidates = process.env.VERCEL
    ? [requestHeaders.get("x-vercel-forwarded-for")]
    : [
        requestHeaders.get("x-forwarded-for"),
        requestHeaders.get("x-real-ip"),
      ];

  for (const candidate of candidates) {
    const value = candidate?.split(",")[0]?.trim();

    if (value && isIP(value)) return value;
  }

  return "unknown";
}

function hashIdentifier(value: string): string {
  return createHash("sha256").update(value).digest("base64url");
}
