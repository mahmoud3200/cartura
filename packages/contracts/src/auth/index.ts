import { z } from "zod";

export const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  emailVerified: z.boolean(),
  image: z.string().nullable().optional(),
  createdAt: z.iso.datetime().or(z.date()),
  updatedAt: z.iso.datetime().or(z.date()),
});

export const registerRequestSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.email().toLowerCase(),
  password: z.string().min(8).max(128),
});

export const loginRequestSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().optional(),
});

export const loginResponseSchema = z.union([
  z.object({
    redirect: z.boolean(),
    token: z.string(),
    url: z.string().optional(),
    user: authUserSchema,
  }),
  z.object({
    twoFactorRedirect: z.literal(true),
    twoFactorMethods: z.array(z.enum(["otp", "totp", "backup-code"])),
  }),
]);

export const logoutRequestSchema = z.object({});

export const verifyEmailRequestSchema = z.object({
  email: z.email().toLowerCase(),
  code: z.string().length(6),
});

export const resendVerificationEmailRequestSchema = z.object({
  email: z.email().toLowerCase(),
});

export const forgotPasswordRequestSchema = z.object({
  email: z.email().toLowerCase(),
});

export const resetPasswordRequestSchema = z.object({
  email: z.email().toLowerCase(),
  code: z.string().length(6),
  password: z.string().min(8).max(128),
});

export const sendTwoFactorOtpRequestSchema = z
  .object({
    trustDevice: z.boolean().optional(),
  })
  .optional();

export const verifyTwoFactorOtpRequestSchema = z.object({
  code: z.string().length(6),
  trustDevice: z.boolean().optional(),
});

export const enableTwoFactorRequestSchema = z.object({
  password: z.string().min(1).max(128),
});

export const disableTwoFactorRequestSchema = enableTwoFactorRequestSchema;

export const oauthProviderSchema = z.enum(["google"]);

export const oauthAuthorizeRequestSchema = z.object({
  provider: oauthProviderSchema,
  callbackURL: z.url().optional(),
});

export const authMessageResponseSchema = z.object({
  message: z.string(),
});

export const authMeResponseSchema = z.object({
  user: authUserSchema.nullable(),
});

export type AuthUser = z.infer<typeof authUserSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type LogoutRequest = z.infer<typeof logoutRequestSchema>;
export type VerifyEmailRequest = z.infer<typeof verifyEmailRequestSchema>;
export type ResendVerificationEmailRequest = z.infer<
  typeof resendVerificationEmailRequestSchema
>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export type SendTwoFactorOtpRequest = z.infer<
  typeof sendTwoFactorOtpRequestSchema
>;
export type VerifyTwoFactorOtpRequest = z.infer<
  typeof verifyTwoFactorOtpRequestSchema
>;
export type EnableTwoFactorRequest = z.infer<typeof enableTwoFactorRequestSchema>;
export type DisableTwoFactorRequest = z.infer<
  typeof disableTwoFactorRequestSchema
>;
export type OAuthProvider = z.infer<typeof oauthProviderSchema>;
export type OAuthAuthorizeRequest = z.infer<typeof oauthAuthorizeRequestSchema>;
export type AuthMessageResponse = z.infer<typeof authMessageResponseSchema>;
export type AuthMeResponse = z.infer<typeof authMeResponseSchema>;
