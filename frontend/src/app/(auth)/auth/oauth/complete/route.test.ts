import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { getCurrentAuthSession } from "@/features/auth/api/auth-api";

import { GET } from "./route";

vi.mock("@/features/auth/api/auth-api", () => ({
  getCurrentAuthSession: vi.fn(),
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

const session = {
  session: {
    id: "b6f8dc4b-fddf-4f75-9365-7e9f28bab6b4",
    userId: "4827df39-7600-48d4-af9e-5de753579fe5",
    token: "oauth-session-token",
    expiresAt: "2026-09-18T00:00:00.000Z",
    ipAddress: null,
    userAgent: null,
    createdAt: "2026-08-19T00:00:00.000Z",
    updatedAt: "2026-08-19T00:00:00.000Z",
  },
  user: {
    id: "4827df39-7600-48d4-af9e-5de753579fe5",
    name: "OAuth User",
    firstName: "OAuth",
    lastName: "User",
    email: "oauth@example.com",
    emailVerified: true,
    image: null,
    twoFactorEnabled: false,
    accountStatus: "active" as const,
    accountStatusReason: null,
    suspendedUntil: null,
    createdAt: "2026-08-19T00:00:00.000Z",
    updatedAt: "2026-08-19T00:00:00.000Z",
  },
};

describe("OAuth completion route", () => {
  beforeEach(() => {
    vi.mocked(getCurrentAuthSession).mockResolvedValue(session);
  });

  it("copies the OAuth session into the frontend bearer cookie", async () => {
    const response = await GET(
      new NextRequest(
        "https://shop.cartura.test/auth/oauth/complete?redirectTo=%2Fsettings%2Forders",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://shop.cartura.test/settings/orders",
    );
    expect(response.cookies.get("cartura_session_token")?.value).toBe(
      "oauth-session-token",
    );
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=lax");
  });

  it("returns to login when Better Auth did not create a session", async () => {
    vi.mocked(getCurrentAuthSession).mockResolvedValue(null);

    const response = await GET(
      new NextRequest("https://shop.cartura.test/auth/oauth/complete"),
    );

    expect(response.headers.get("location")).toBe(
      "https://shop.cartura.test/auth/login?oauth=missing_session",
    );
    expect(response.cookies.get("cartura_session_token")).toBeUndefined();
  });

  it("rejects an external completion redirect", async () => {
    const response = await GET(
      new NextRequest(
        "https://shop.cartura.test/auth/oauth/complete?redirectTo=https%3A%2F%2Fevil.example",
      ),
    );

    expect(response.headers.get("location")).toBe("https://shop.cartura.test/");
  });
});
