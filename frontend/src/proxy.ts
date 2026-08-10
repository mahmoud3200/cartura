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
    request.nextUrl.origin,
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

async function getAccountRestriction(sessionToken: string, origin: string) {
  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/auth/get-session`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${sessionToken}`,
        Origin: origin,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload: unknown = await response.json();
    const user =
      payload && typeof payload === "object" && "user" in payload
        ? payload.user
        : null;

    if (!user || typeof user !== "object" || !("accountStatus" in user)) {
      return null;
    }

    if (user.accountStatus === "disabled") {
      return "disabled";
    }

    if (user.accountStatus !== "suspended") {
      return null;
    }

    const suspendedUntil =
      "suspendedUntil" in user && typeof user.suspendedUntil === "string"
        ? new Date(user.suspendedUntil).getTime()
        : null;

    return suspendedUntil !== null && suspendedUntil <= Date.now()
      ? "expired"
      : "suspended";
  } catch {
    return null;
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg)$).*)",
  ],
};
