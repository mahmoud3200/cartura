import { afterEach, describe, expect, it, vi } from "vitest";

import { startGoogleOAuth } from "./oauth-client";

describe("startGoogleOAuth", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts Google OAuth through the same-origin auth proxy", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          url: "https://accounts.google.com/o/oauth2/v2/auth?state=signed-state",
          redirect: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const destination = await startGoogleOAuth({
      provider: "google",
      callbackURL: "http://localhost:3000/dashboard",
      errorCallbackURL: "http://localhost:3000/auth/register?oauth=failed",
      newUserCallbackURL: "http://localhost:3000/dashboard",
    });

    expect(destination).toContain("accounts.google.com");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/sign-in/social",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );
  });
});
