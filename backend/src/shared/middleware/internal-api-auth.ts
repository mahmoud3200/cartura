import { timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";

import {
  CARTURA_BFF_AUTHORIZATION_HEADER,
  CARTURA_CLIENT_IP_HEADER,
} from "@cartura/contracts/common";
import type { Request, RequestHandler } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";

import { env } from "../../config/env.js";
import { httpError } from "../errors/index.js";
import { getRequestContext } from "./request-context.js";

const oidcIssuer = env.VERCEL_OIDC_ISSUER?.replace(/\/$/, "");
const oidcJwks = oidcIssuer
  ? createRemoteJWKSet(new URL(`${oidcIssuer}/.well-known/jwks`))
  : null;

export const requireInternalApiAccess: RequestHandler = async (
  req,
  _res,
  next,
) => {
  if (isPublicPaymobWebhook(req)) {
    next();
    return;
  }

  try {
    await verifyInternalAuthorization(req);
    applyTrustedClientIp(req);
    next();
  } catch (error) {
    next(
      error && typeof error === "object" && "statusCode" in error
        ? error
        : httpError(
            401,
            "UNTRUSTED_BFF",
            "This API endpoint accepts requests only from the configured BFF",
          ),
    );
  }
};

async function verifyInternalAuthorization(req: Request): Promise<void> {
  if (env.INTERNAL_API_AUTH_MODE === "disabled") return;

  const value = req.get(CARTURA_BFF_AUTHORIZATION_HEADER);
  const token = value?.startsWith("Bearer ") ? value.slice(7) : "";

  if (!token) throw new Error("Missing BFF authorization token");

  if (env.INTERNAL_API_AUTH_MODE === "shared-secret") {
    if (!safeEqual(token, env.INTERNAL_API_SHARED_SECRET)) {
      throw new Error("Invalid BFF shared secret");
    }

    return;
  }

  if (!oidcIssuer || !oidcJwks) {
    throw new Error("Vercel OIDC is not configured");
  }

  await jwtVerify(token, oidcJwks, {
    issuer: oidcIssuer,
    audience: env.VERCEL_OIDC_AUDIENCE,
    subject: env.VERCEL_OIDC_SUBJECT,
  });
}

function applyTrustedClientIp(req: Request): void {
  const value = req.get(CARTURA_CLIENT_IP_HEADER)?.trim();

  if (value && isIP(value)) {
    getRequestContext(req).ipAddress = value;
  }
}

function isPublicPaymobWebhook(req: Request): boolean {
  return req.method === "POST" && req.path === "/payments/paymob/webhook";
}

function safeEqual(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}
