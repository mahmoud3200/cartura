import { describe, expect, it } from "vitest";

import {
  createOAuthRedirectUrls,
  getOAuthCompletionRedirect,
  getOAuthEntryPath,
  getSafeInternalRedirect,
} from "./auth-redirects";

describe("auth redirects", () => {
  it("keeps internal destinations and rejects open redirects", () => {
    expect(getSafeInternalRedirect("/settings/orders?status=open")).toBe(
      "/settings/orders?status=open",
    );
    expect(getSafeInternalRedirect("//malicious.example/path")).toBe(
      "/",
    );
    expect(getSafeInternalRedirect("https://malicious.example/path")).toBe(
      "/",
    );
  });

  it("builds trusted OAuth destinations for a registration flow", () => {
    expect(
      createOAuthRedirectUrls({
        frontendUrl: "https://shop.cartura.test",
        redirectTo: "/dashboard",
        flow: "register",
      }),
    ).toEqual({
      callbackURL:
        "https://shop.cartura.test/auth/oauth/complete?redirectTo=%2Fdashboard",
      errorCallbackURL:
        "https://shop.cartura.test/auth/register?oauth=failed",
      newUserCallbackURL:
        "https://shop.cartura.test/auth/oauth/complete?redirectTo=%2Fdashboard",
    });
  });

  it("keeps OAuth completion redirects on this site", () => {
    expect(getOAuthCompletionRedirect("/settings/orders")).toBe(
      "/settings/orders",
    );
    expect(getOAuthCompletionRedirect("https://malicious.example")).toBe("/");
  });

  it("returns the page that initiated OAuth", () => {
    expect(getOAuthEntryPath("login")).toBe("/auth/login");
    expect(getOAuthEntryPath("register")).toBe("/auth/register");
  });
});
