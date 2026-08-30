import assert from "node:assert/strict";
import test from "node:test";

import { registerRequestSchema } from "@cartura/contracts/auth";

import { httpError } from "../../shared/errors/index.js";
import { authRateLimitOptions } from "./auth.options.js";
import { isAuthRestrictionExemptPath } from "./auth-route.policy.js";
import { assertSessionCreationAllowed } from "./auth-session.policy.js";
import { normalizeEmailSignUpBody } from "./auth-signup.middleware.js";

test("auth uses persistent rate limits and a narrow recovery allowlist", () => {
  assert.equal(authRateLimitOptions.storage, "database");
  assert.equal(isAuthRestrictionExemptPath("/api/v1/auth/sign-in/email"), true);
  assert.equal(isAuthRestrictionExemptPath("/api/v1/auth/change-password"), false);
  assert.equal(
    isAuthRestrictionExemptPath("/api/v1/auth/email-otp/request-email-change"),
    false,
  );
});

test("restricted accounts cannot create a fresh session", async () => {
  await assert.rejects(
    assertSessionCreationAllowed("user-1", async () => {
      throw httpError(403, "ACCOUNT_DISABLED", "Account is disabled");
    }),
    (error: unknown) =>
      Boolean(
        error &&
          typeof error === "object" &&
          "statusCode" in error &&
          error.statusCode === 403,
      ),
  );
});

test("signup stays on the Better Auth request and rejects unknown fields", () => {
  const body = normalizeEmailSignUpBody({
    firstName: " Mona ",
    lastName: " Ali ",
    email: "MONA@example.com",
    password: "valid-password",
  });

  assert.equal(body.name, "Mona Ali");
  assert.equal(body.email, "mona@example.com");
  assert.equal(
    registerRequestSchema.safeParse({ ...body, image: "https://example.com/a" })
      .success,
    false,
  );
});
