import { createHash } from "node:crypto";

import { RATE_LIMIT_EXCEEDED_CODE } from "@cartura/contracts/common";
import type { Request, RequestHandler } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { RedisStore, type RedisReply } from "rate-limit-redis";

import {
  rateLimitConfig,
  type RateLimitPolicyName,
} from "../../config/rate-limit.js";
import { rateLimitRedisClient } from "../../infrastructure/rate-limit-redis.client.js";
import { httpError } from "../errors/index.js";
import { getOptionalAuthenticatedUserId } from "../utils/request.utils.js";
import { getRequestContext } from "./request-context.js";

export const coarseRateLimit = createRateLimit("coarse", false);
export const readRateLimit = createRateLimit("read", true);
export const mutationRateLimit = createRateLimit("mutation", true);
export const mediaRateLimit = createRateLimit("media", true);
export const checkoutRateLimit = createRateLimit("checkout", true);
export const privilegedRateLimit = createRateLimit("privileged", true);
export const webhookRateLimit = createRateLimit("webhook", false);

function createRateLimit(
  policyName: RateLimitPolicyName,
  preferAuthenticatedUser: boolean,
): RequestHandler {
  const policy = rateLimitConfig.policies[policyName];
  const redisClient = rateLimitRedisClient;

  return rateLimit({
    windowMs: policy.windowMs,
    limit: policy.limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    passOnStoreError: !policy.failClosed,
    skip: () => !rateLimitConfig.enabled,
    keyGenerator: (req) =>
      createRateLimitKey(req, preferAuthenticatedUser),
    ...(redisClient
      ? {
          store: new RedisStore({
            prefix: `${rateLimitConfig.redisPrefix}:${policyName}:`,
            sendCommand: async (command: string, ...args: string[]) => {
              try {
                return (await redisClient.call(
                  command,
                  ...args,
                )) as RedisReply;
              } catch (error) {
                console.error("Rate-limit Redis command failed", {
                  policy: policyName,
                  error,
                });
                throw httpError(
                  503,
                  "RATE_LIMIT_UNAVAILABLE",
                  "Request protection is temporarily unavailable",
                  { policy: policyName },
                );
              }
            },
          }),
        }
      : {}),
    handler: (req, _res, next, options) => {
      const retryAfterSeconds = getRetryAfterSeconds(req, policy.windowMs);

      next(
        httpError(
          options.statusCode,
          RATE_LIMIT_EXCEEDED_CODE,
          `Too many requests. Try again in ${retryAfterSeconds} seconds.`,
          { retryAfterSeconds, policy: policyName },
        ),
      );
    },
  });
}

function createRateLimitKey(
  req: Request,
  preferAuthenticatedUser: boolean,
): string {
  const userId = preferAuthenticatedUser
    ? getOptionalAuthenticatedUserId(req)
    : undefined;

  if (userId) return hashKey(`user:${userId}`);

  const ip = getRequestContext(req).ipAddress ?? req.ip ?? "unknown";

  return hashKey(`ip:${ipKeyGenerator(ip, 56)}`);
}

function getRetryAfterSeconds(req: Request, windowMs: number): number {
  const rateLimitRequest = req as Request & {
    rateLimit?: { resetTime?: Date };
  };
  const resetTime = rateLimitRequest.rateLimit?.resetTime?.getTime();

  if (!resetTime) return Math.ceil(windowMs / 1000);

  return Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
}

function hashKey(value: string): string {
  return createHash("sha256").update(value).digest("base64url");
}
