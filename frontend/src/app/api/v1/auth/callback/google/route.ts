import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { completeGoogleOAuthCallback } from "@/features/auth/api/oauth-callback-api";
import { authSessionTokenCookieOptions } from "@/shared/api/auth-token";
import { AUTH_SESSION_TOKEN_COOKIE } from "@/shared/lib/auth-session";
import { appendRateLimitHeaders } from "@/shared/api/rate-limit-headers";

const redirectStatuses = new Set([301, 302, 303, 307, 308]);

export async function GET(request: NextRequest) {
  const upstreamResponse = await completeGoogleOAuthCallback({
    search: request.nextUrl.search,
    cookieHeader: request.headers.get("cookie"),
    origin: request.nextUrl.origin,
    userAgent: request.headers.get("user-agent"),
  });
  const response = await createCallbackResponse(request, upstreamResponse);
  const authToken = upstreamResponse.headers.get("set-auth-token");

  if (authToken) {
    response.cookies.set(
      AUTH_SESSION_TOKEN_COOKIE,
      authToken,
      authSessionTokenCookieOptions,
    );
  }

  copySetCookieHeaders(upstreamResponse, response);
  appendRateLimitHeaders(response.headers, upstreamResponse.headers);

  return response;
}

async function createCallbackResponse(
  request: NextRequest,
  upstreamResponse: Response,
) {
  const location = upstreamResponse.headers.get("location");

  if (location && redirectStatuses.has(upstreamResponse.status)) {
    return NextResponse.redirect(new URL(location, request.url), {
      status: upstreamResponse.status as 301 | 302 | 303 | 307 | 308,
    });
  }

  return new NextResponse(await upstreamResponse.arrayBuffer(), {
    status: upstreamResponse.status,
    headers: {
      "Content-Type":
        upstreamResponse.headers.get("content-type") ?? "application/json",
    },
  });
}

function copySetCookieHeaders(source: Response, destination: NextResponse) {
  const headers = source.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const setCookieHeaders = headers.getSetCookie?.() ?? [];

  if (!setCookieHeaders.length) {
    const setCookieHeader = source.headers.get("set-cookie");

    if (setCookieHeader) {
      destination.headers.append("set-cookie", setCookieHeader);
    }

    return;
  }

  for (const setCookieHeader of setCookieHeaders) {
    destination.headers.append("set-cookie", setCookieHeader);
  }
}
