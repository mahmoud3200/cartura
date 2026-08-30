import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getCurrentAuthSession } from "@/features/auth/api/auth-api";
import { getOAuthCompletionRedirect } from "@/features/auth/lib/auth-redirects";
import { authSessionTokenCookieOptions } from "@/shared/api/auth-token";
import { AUTH_SESSION_TOKEN_COOKIE } from "@/shared/lib/auth-session";

export async function GET(request: NextRequest) {
  const destination = getOAuthCompletionRedirect(
    request.nextUrl.searchParams.get("redirectTo"),
  );
  const authSession = await getCurrentAuthSession();

  if (!authSession) {
    return NextResponse.redirect(
      new URL("/auth/login?oauth=missing_session", request.url),
    );
  }

  const response = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.set(
    AUTH_SESSION_TOKEN_COOKIE,
    authSession.session.token,
    authSessionTokenCookieOptions,
  );

  return response;
}
