import "server-only";

import { isIP } from "node:net";

import {
  CARTURA_BFF_AUTHORIZATION_HEADER,
  CARTURA_CLIENT_IP_HEADER,
} from "@cartura/contracts/common";
import { getVercelOidcToken } from "@vercel/oidc";
import { headers } from "next/headers";

type InternalAuthMode = "vercel-oidc" | "shared-secret" | "disabled";

const mode = (process.env.CARTURA_INTERNAL_AUTH_MODE ??
  (process.env.NODE_ENV === "production" ? "vercel-oidc" : "disabled")) as InternalAuthMode;

if (!(["vercel-oidc", "shared-secret", "disabled"] as const).includes(mode)) {
  throw new Error(`Unsupported CARTURA_INTERNAL_AUTH_MODE: ${mode}`);
}

if (process.env.NODE_ENV === "production" && mode === "disabled") {
  throw new Error("CARTURA_INTERNAL_AUTH_MODE cannot be disabled in production");
}

export async function getInternalServiceHeaders(): Promise<Record<string, string>> {
  const requestHeaders = await headers();
  const authorization = await getAuthorizationValue();
  const clientIp = getTrustedClientIp(requestHeaders);

  return {
    ...(authorization
      ? { [CARTURA_BFF_AUTHORIZATION_HEADER]: authorization }
      : {}),
    ...(clientIp ? { [CARTURA_CLIENT_IP_HEADER]: clientIp } : {}),
  };
}

async function getAuthorizationValue(): Promise<string | null> {
  if (mode === "disabled") return null;

  if (mode === "shared-secret") {
    const secret = process.env.CARTURA_INTERNAL_SHARED_SECRET?.trim() ?? "";

    if (secret.length < 32) {
      throw new Error(
        "CARTURA_INTERNAL_SHARED_SECRET must be at least 32 characters",
      );
    }

    return `Bearer ${secret}`;
  }

  return `Bearer ${await getVercelOidcToken()}`;
}

function getTrustedClientIp(requestHeaders: Headers): string | null {
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

  return null;
}
