import { describe, expect, it, vi } from "vitest";

import { ApiError, getApiErrorMessage } from "./server-api-error";
import { readApiResponse } from "./server-api-response";
import { getRequestOrigin } from "./server-request-origin";
import {
  forwardResponseCookies,
  parseSetCookie,
  splitSetCookieHeader,
} from "./server-response-cookies";

describe("server API errors and responses", () => {
  it("reads successful JSON and plain-text responses", async () => {
    const jsonResponse = new Response(JSON.stringify({ data: { id: "1" } }), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
    const textResponse = new Response("accepted");

    await expect(readApiResponse(jsonResponse)).resolves.toEqual({
      data: { id: "1" },
    });
    await expect(readApiResponse(textResponse)).resolves.toBe("accepted");
  });

  it("turns unsuccessful responses into ApiError instances", async () => {
    const payload = { error: { message: "Invalid request" } };
    const response = new Response(JSON.stringify(payload), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });

    await expect(readApiResponse(response)).rejects.toEqual(
      new ApiError("Invalid request", 422, payload),
    );
    expect(getApiErrorMessage({ message: "Try again" })).toBe("Try again");
    expect(getApiErrorMessage(null)).toBe(
      "The request could not be completed.",
    );
  });
});

describe("server request origins", () => {
  it("prefers the request origin and reconstructs it from proxy headers", () => {
    expect(
      getRequestOrigin(new Headers({ origin: "https://shop.cartura.test" })),
    ).toBe("https://shop.cartura.test");
    expect(
      getRequestOrigin(
        new Headers({
          host: "preview.cartura.test",
          "x-forwarded-proto": "https",
        }),
      ),
    ).toBe("https://preview.cartura.test");
    expect(getRequestOrigin(new Headers({ host: "localhost:3000" }))).toBe(
      "http://localhost:3000",
    );
  });
});

describe("server response cookies", () => {
  it("splits combined cookie headers without splitting Expires dates", () => {
    expect(
      splitSetCookieHeader(
        "session=abc; Expires=Wed, 21 Oct 2037 07:28:00 GMT, theme=dark; Path=/",
      ),
    ).toEqual([
      "session=abc; Expires=Wed, 21 Oct 2037 07:28:00 GMT",
      " theme=dark; Path=/",
    ]);
  });

  it("parses supported attributes and preserves equals signs in values", () => {
    expect(
      parseSetCookie(
        "session=abc==; Path=/; Max-Age=3600; HttpOnly; Secure; SameSite=Lax",
      ),
    ).toEqual({
      name: "session",
      value: "abc==",
      options: {
        path: "/",
        maxAge: 3600,
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      },
    });
  });

  it("writes every valid response cookie to the Next.js cookie store", () => {
    const set = vi.fn();
    const response = {
      headers: {
        getSetCookie: () => ["session=abc; HttpOnly", "invalid"],
      },
    } as unknown as Response;

    forwardResponseCookies(response, { set });

    expect(set).toHaveBeenCalledOnce();
    expect(set).toHaveBeenCalledWith("session", "abc", { httpOnly: true });
  });
});
