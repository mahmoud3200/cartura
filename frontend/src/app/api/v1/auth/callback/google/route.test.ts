import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { completeGoogleOAuthCallback } from "@/features/auth/api/oauth-callback-api";

import { GET } from "./route";

vi.mock("@/features/auth/api/oauth-callback-api", () => ({
  completeGoogleOAuthCallback: vi.fn(),
}));

vi.mock("@/shared/api/auth-token", () => ({
  authSessionTokenCookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  },
}));

describe("Google OAuth callback route", () => {
  beforeEach(() => {
    const headers = new Headers({
      Location:
        "http://localhost:3000/auth/oauth/complete?redirectTo=%2Fsettings",
      "Set-Auth-Token": "signed-session-token.signature",
    });
    headers.append(
      "Set-Cookie",
      "better-auth.session_token=signed-session-token.signature; Path=/; HttpOnly; SameSite=Lax",
    );

    vi.mocked(completeGoogleOAuthCallback).mockResolvedValue(
      new Response(null, { status: 302, headers }),
    );
  });

  it("preserves the OAuth cookies and stores the issued auth token", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/v1/auth/callback/google?code=google-code&state=oauth-state",
      {
        headers: {
          Cookie: "better-auth.oauth_state=signed-state",
          "User-Agent": "Cartura test browser",
        },
      },
    );
    const response = await GET(request);

    expect(completeGoogleOAuthCallback).toHaveBeenCalledWith({
      search: "?code=google-code&state=oauth-state",
      cookieHeader: "better-auth.oauth_state=signed-state",
      origin: "http://localhost:3000",
      userAgent: "Cartura test browser",
    });
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/auth/oauth/complete?redirectTo=%2Fsettings",
    );
    expect(response.headers.get("set-cookie")).toContain(
      "better-auth.session_token=signed-session-token.signature",
    );
    expect(response.cookies.get("cartura_session_token")?.value).toBe(
      "signed-session-token.signature",
    );
  });

  it("does not invent a frontend token when Better Auth omits it", async () => {
    vi.mocked(completeGoogleOAuthCallback).mockResolvedValue(
      new Response(JSON.stringify({ message: "OAuth callback failed" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await GET(
      new NextRequest(
        "http://localhost:3000/api/v1/auth/callback/google?error=access_denied",
      ),
    );

    expect(response.status).toBe(400);
    expect(response.cookies.get("cartura_session_token")).toBeUndefined();
    await expect(response.json()).resolves.toEqual({
      message: "OAuth callback failed",
    });
  });
});
