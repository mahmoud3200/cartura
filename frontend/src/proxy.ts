import { isIP } from "node:net";

import { authMeResponseSchema } from "@cartura/contracts/auth";
import {
  CARTURA_BFF_AUTHORIZATION_HEADER,
  CARTURA_CLIENT_IP_HEADER,
} from "@cartura/contracts/common";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const authSessionTokenCookie = "cartura_session_token";
const restrictedAccountPath = "/account-restricted";
const apiBaseUrl = process.env.CARTURA_API_URL ?? "http://localhost:4000";

export async function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get(authSessionTokenCookie)?.value;

  if (!sessionToken) {
    return NextResponse.next();
  }

  const restriction = await getAccountRestriction(
    sessionToken,
    request,
  );

  if (
    restriction === "expired" &&
    request.nextUrl.pathname === restrictedAccountPath
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (
    (restriction === "suspended" || restriction === "disabled") &&
    request.nextUrl.pathname !== restrictedAccountPath
  ) {
    return NextResponse.redirect(new URL(restrictedAccountPath, request.url));
  }

  return NextResponse.next();
}

async function getAccountRestriction(
  sessionToken: string,
  request: NextRequest,
) {
  try {
    const internalHeaders = getProxyInternalHeaders(request);
    const response = await fetch(`${apiBaseUrl}/api/v1/auth/get-session`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${sessionToken}`,
        Origin: request.nextUrl.origin,
        ...internalHeaders,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const result = authMeResponseSchema.safeParse(await response.json());
    const user = result.success ? (result.data?.user ?? null) : null;

    if (!user) {
      return null;
    }

    if (user.accountStatus === "disabled") {
      return "disabled";
    }

    if (user.accountStatus !== "suspended") {
      return null;
    }

    const suspendedUntil = user.suspendedUntil
      ? new Date(user.suspendedUntil).getTime()
      : null;

    return suspendedUntil !== null && suspendedUntil <= Date.now()
      ? "expired"
      : "suspended";
  } catch {
    return null;
  }
}

function getProxyInternalHeaders(request: NextRequest): Record<string, string> {
  const mode = process.env.CARTURA_INTERNAL_AUTH_MODE ??
    (process.env.NODE_ENV === "production" ? "vercel-oidc" : "disabled");
  const clientIp = getProxyClientIp(request);
  let authorization: string | null = null;

  if (mode === "vercel-oidc") {
    const token = request.headers.get("x-vercel-oidc-token");
    authorization = token ? `Bearer ${token}` : null;
  } else if (mode === "shared-secret") {
    const secret = process.env.CARTURA_INTERNAL_SHARED_SECRET?.trim();
    authorization = secret ? `Bearer ${secret}` : null;
  }

  return {
    ...(authorization
      ? { [CARTURA_BFF_AUTHORIZATION_HEADER]: authorization }
      : {}),
    ...(clientIp ? { [CARTURA_CLIENT_IP_HEADER]: clientIp } : {}),
  };
}

function getProxyClientIp(request: NextRequest): string | null {
  const value = (process.env.VERCEL
    ? request.headers.get("x-vercel-forwarded-for")
    : request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip"))
    ?.split(",")[0]
    ?.trim();

  return value && isIP(value) ? value : null;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg)$).*)",
  ],
};
