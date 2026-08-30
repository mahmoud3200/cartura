import { env } from "../../config/env.js";

export const authPaths = {
  "/api/v1/auth/sign-up/email": {
    post: {
      tags: ["Auth"],
      summary: "Create an email/password account",
      description:
        "Better Auth endpoint. With email OTP enabled, a 6-digit verification code is sent after sign-up.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/BetterAuthSignUpEmail" },
          },
        },
      },
      responses: {
        "200": { description: "Account created" },
        "400": { $ref: "#/components/responses/AuthError" },
      },
    },
  },
  "/api/v1/auth/sign-in/email": {
    post: {
      tags: ["Auth"],
      summary: "Sign in with email and password",
      description:
        "Signs in with email and password. If the user enabled 2FA, this returns a two-factor challenge instead of the final session token.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/BetterAuthSignInEmail" },
          },
        },
      },
      responses: {
        "200": { description: "Signed in" },
        "401": { $ref: "#/components/responses/AuthError" },
      },
    },
  },
  "/api/v1/auth/sign-out": {
    post: {
      tags: ["Auth"],
      summary: "Sign out current session",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Signed out" },
      },
    },
  },
  "/api/v1/auth/two-factor/send-otp": {
    post: {
      tags: ["Auth"],
      summary: "Send 2FA verification code",
      description:
        "For a logged-in user, this sends the code used to enable email OTP 2FA. During login, call this after sign-in returns twoFactorRedirect=true; it then uses Better Auth's temporary 2FA cookie.",
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                trustDevice: { type: "boolean" },
              },
            },
          },
        },
      },
      responses: {
        "200": { description: "Sign-in code sent" },
      },
    },
  },
  "/api/v1/auth/two-factor/verify-otp": {
    post: {
      tags: ["Auth"],
      summary: "Verify 2FA code",
      description:
        "For a logged-in user, verifies the code and enables email OTP 2FA. During login, verifies the challenge and returns the final Better Auth session token.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/BetterAuthVerifySignInOtp" },
          },
        },
      },
      responses: {
        "200": { description: "Sign-in verified; final token returned" },
        "400": { $ref: "#/components/responses/AuthError" },
      },
    },
  },
  "/api/v1/auth/two-factor/disable": {
    post: {
      tags: ["Auth"],
      summary: "Disable 2FA",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["password"],
              properties: {
                password: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        "200": { description: "2FA disabled" },
        "400": { $ref: "#/components/responses/AuthError" },
      },
    },
  },
  "/api/v1/auth/get-session": {
    get: {
      tags: ["Auth"],
      summary: "Get current session",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "Current session or null" },
      },
    },
  },
  "/api/v1/auth/email-otp/send-verification-otp": {
    post: {
      tags: ["Auth"],
      summary: "Send a verification code",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/BetterAuthSendOtp" },
          },
        },
      },
      responses: {
        "200": { description: "Code sent when applicable" },
      },
    },
  },
  "/api/v1/auth/email-otp/verify-email": {
    post: {
      tags: ["Auth"],
      summary: "Verify email with a 6-digit code",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/BetterAuthVerifyEmailOtp" },
          },
        },
      },
      responses: {
        "200": { description: "Email verified" },
        "400": { $ref: "#/components/responses/AuthError" },
      },
    },
  },
  "/api/v1/auth/email-otp/request-password-reset": {
    post: {
      tags: ["Auth"],
      summary: "Send a password reset code",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/EmailRequest" },
          },
        },
      },
      responses: {
        "200": { description: "Reset code sent when applicable" },
      },
    },
  },
  "/api/v1/auth/email-otp/reset-password": {
    post: {
      tags: ["Auth"],
      summary: "Reset password with a 6-digit code",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/BetterAuthResetPasswordOtp" },
          },
        },
      },
      responses: {
        "200": { description: "Password reset" },
        "400": { $ref: "#/components/responses/AuthError" },
      },
    },
  },
  "/api/v1/auth/sign-in/social": {
    post: {
      tags: ["Auth"],
      summary: "Start Google OAuth sign-in",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/BetterAuthSocialSignIn" },
          },
        },
      },
      responses: {
        "200": { description: "OAuth redirect URL" },
      },
    },
  },
  "/api/v1/auth/token": {
    get: {
      tags: ["Auth"],
      summary: "Get Better Auth JWT for current session",
      description:
        "Optional. Requires an active session via cookie or Authorization: Bearer <session-token>; returns a short-lived JWT.",
      security: [{ bearerAuth: [] }],
      responses: {
        "200": { description: "JWT token" },
        "401": { $ref: "#/components/responses/AuthError" },
      },
    },
  },
} as const;

export const devOnlyAuthPaths =
  env.NODE_ENV === "development"
    ? {
        "/api/v1/auth/reference": {
          get: {
            tags: ["Auth"],
            summary: "Better Auth generated API reference",
            responses: {
              "200": { description: "Better Auth API reference UI" },
            },
          },
        },
        "/api/v1/auth/open-api/generate-schema": {
          get: {
            tags: ["Auth"],
            summary: "Better Auth generated OpenAPI schema",
            responses: {
              "200": { description: "Generated Better Auth OpenAPI schema" },
            },
          },
        },
      }
    : {};

