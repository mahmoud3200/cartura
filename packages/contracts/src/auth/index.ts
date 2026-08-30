import { z } from "zod";
import { userAccountStatusSchema } from "../users/index.js";

export const authUserSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  twoFactorEnabled: z.boolean(),
  accountStatus: userAccountStatusSchema,
  accountStatusReason: z.string().nullable(),
  suspendedUntil: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const authSessionSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  token: z.string().min(1),
  expiresAt: z.iso.datetime(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const restrictedAccountStatusSchema = z.enum([
  "suspended",
  "disabled",
]);

export const accountRestrictionSchema = z.object({
  accountStatus: restrictedAccountStatusSchema,
  statusReason: z.string().nullable(),
  suspendedUntil: z.iso.datetime().nullable(),
});

export const updateProfileRequestSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
  })
  .strict()
  .transform((input) => ({
    ...input,
    name: `${input.firstName} ${input.lastName}`,
  }));

export const updateProfileResponseSchema = z.object({
  status: z.literal(true),
});

export const registerRequestSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.email().toLowerCase(),
    password: z.string().min(8).max(128),
  })
  .strict();

export const signUpEmailRequestSchema = registerRequestSchema.extend({
  callbackURL: z.url().optional(),
  rememberMe: z.boolean().optional(),
}).strict();

export const loginRequestSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().optional(),
}).strict();

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

export const logoutRequestSchema = z.object({}).strict();

export const verifyEmailRequestSchema = z.object({
  email: z.email().toLowerCase(),
  code: z.string().length(6),
}).strict();

export const resendVerificationEmailRequestSchema = z.object({
  email: z.email().toLowerCase(),
}).strict();

export const forgotPasswordRequestSchema = z.object({
  email: z.email().toLowerCase(),
}).strict();

export const resetPasswordRequestSchema = z.object({
  email: z.email().toLowerCase(),
  code: z.string().length(6),
  password: z.string().min(8).max(128),
}).strict();

export const sendTwoFactorOtpRequestSchema = z
  .object({
    trustDevice: z.boolean().optional(),
  })
  .strict()
  .optional();

export const verifyTwoFactorOtpRequestSchema = z.object({
  code: z.string().length(6),
  trustDevice: z.boolean().optional(),
}).strict();

export const enableTwoFactorRequestSchema = z.object({
  password: z.string().min(1).max(128),
}).strict();

export const disableTwoFactorRequestSchema = enableTwoFactorRequestSchema;

export const oauthProviderSchema = z.enum(["google"]);

export const oauthAuthorizeRequestSchema = z.object({
  provider: oauthProviderSchema,
  callbackURL: z.url(),
  errorCallbackURL: z.url().optional(),
  newUserCallbackURL: z.url().optional(),
}).strict();

export const oauthAuthorizeResponseSchema = z.object({
  url: z.url(),
  redirect: z.boolean().optional(),
});

export const authMessageResponseSchema = z.object({
  message: z.string(),
});

// Better Auth returns a session object when authenticated and the JSON literal
// `null` when no valid session is present.
export const authMeResponseSchema = z
  .object({
    session: authSessionSchema,
    user: authUserSchema,
  })
  .nullable();

export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
export type AccountRestriction = z.infer<typeof accountRestrictionSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
export type UpdateProfileResponse = z.infer<typeof updateProfileResponseSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type SignUpEmailRequest = z.infer<typeof signUpEmailRequestSchema>;
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
export type OAuthAuthorizeResponse = z.infer<
  typeof oauthAuthorizeResponseSchema
>;
export type AuthMessageResponse = z.infer<typeof authMessageResponseSchema>;
export type AuthMeResponse = z.infer<typeof authMeResponseSchema>;
