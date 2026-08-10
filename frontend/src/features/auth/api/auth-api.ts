import "server-only";

import { cache } from "react";
import {
  authMeResponseSchema,
  loginResponseSchema,
  oauthAuthorizeResponseSchema,
  type DisableTwoFactorRequest,
  type ForgotPasswordRequest,
  type LoginRequest,
  type LoginResponse,
  type OAuthAuthorizeRequest,
  type RegisterRequest,
  type ResetPasswordRequest,
  type SendTwoFactorOtpRequest,
  type VerifyEmailRequest,
  type VerifyTwoFactorOtpRequest,
} from "@cartura/contracts/auth";

import { ApiError, serverApiFetch } from "@/shared/api/server-api";

export async function register(input: RegisterRequest) {
  return serverApiFetch<unknown>("/api/v1/auth/sign-up/email", {
    method: "POST",
    json: input,
    storeCookies: true,
    withAuth: false,
  });
}

export async function login(input: LoginRequest): Promise<LoginResponse> {
  const payload = await serverApiFetch<unknown>("/api/v1/auth/sign-in/email", {
    method: "POST",
    json: input,
    storeCookies: true,
    withAuth: false,
  });

  return loginResponseSchema.parse(payload);
}

export async function logout() {
  return serverApiFetch<unknown>("/api/v1/auth/sign-out", {
    method: "POST",
    json: {},
    storeCookies: true,
  });
}

export async function resendVerificationEmail(
  input: Pick<VerifyEmailRequest, "email">,
) {
  return serverApiFetch<unknown>("/api/v1/auth/email-otp/send-verification-otp", {
    method: "POST",
    json: {
      email: input.email,
      type: "email-verification",
    },
    withAuth: false,
  });
}

export async function verifyEmail(input: VerifyEmailRequest) {
  return serverApiFetch<unknown>("/api/v1/auth/email-otp/verify-email", {
    method: "POST",
    json: {
      email: input.email,
      otp: input.code,
    },
    storeCookies: true,
    withAuth: false,
  });
}

export async function forgotPassword(input: ForgotPasswordRequest) {
  return serverApiFetch<unknown>("/api/v1/auth/email-otp/request-password-reset", {
    method: "POST",
    json: input,
    withAuth: false,
  });
}

export async function resetPassword(input: ResetPasswordRequest) {
  return serverApiFetch<unknown>("/api/v1/auth/email-otp/reset-password", {
    method: "POST",
    json: {
      email: input.email,
      otp: input.code,
      password: input.password,
    },
    storeCookies: true,
    withAuth: false,
  });
}

export async function sendTwoFactorOtp(input: SendTwoFactorOtpRequest) {
  return serverApiFetch<unknown>("/api/v1/auth/two-factor/send-otp", {
    method: "POST",
    json: input ?? {},
    forwardCookies: true,
    storeCookies: true,
    withAuth: false,
  });
}

export async function verifyTwoFactorOtp(
  input: VerifyTwoFactorOtpRequest,
): Promise<LoginResponse> {
  const payload = await serverApiFetch<unknown>("/api/v1/auth/two-factor/verify-otp", {
    method: "POST",
    json: input,
    forwardCookies: true,
    storeCookies: true,
    withAuth: false,
  });

  return loginResponseSchema.parse(payload);
}

export async function disableTwoFactor(input: DisableTwoFactorRequest) {
  return serverApiFetch<unknown>("/api/v1/auth/two-factor/disable", {
    method: "POST",
    json: input,
    storeCookies: true,
    withAuth: true,
  });
}

export async function startOAuth(input: OAuthAuthorizeRequest) {
  const payload = await serverApiFetch<unknown>("/api/v1/auth/sign-in/social", {
    method: "POST",
    json: input,
    forwardCookies: true,
    storeCookies: true,
    withAuth: false,
  });

  return oauthAuthorizeResponseSchema.parse(payload).url;
}

export const getCurrentAuthUser = cache(async function getCurrentAuthUser() {
  let payload: unknown;

  try {
    payload = await serverApiFetch<unknown>("/api/v1/auth/get-session", {
      method: "GET",
      forwardCookies: true,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return null;
    }

    throw error;
  }

  const user = payload && typeof payload === "object" && "user" in payload
    ? payload.user
    : null;

  return authMeResponseSchema.parse({ user }).user;
});
