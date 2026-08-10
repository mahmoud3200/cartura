import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { openAPI, twoFactor } from "better-auth/plugins";
import { bearer } from "better-auth/plugins/bearer";
import { emailOTP } from "better-auth/plugins/email-otp";
import { jwt } from "better-auth/plugins/jwt";

import { env, frontendOrigins } from "../../config/env.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { mailService } from "../../infrastructure/mail/index.js";
import { assignDefaultCustomerRole } from "../authorization/authorization.provisioning.js";

import { createAuthenticationCodeEmail } from "./auth.email.js";
import { getOtpEmailSubject } from "./auth.utils.js";
import { getGoogleProfileNames } from "./google-profile.js";

export const auth = betterAuth({
  // The public frontend origin proxies /api/v1/auth to this Express server.
  baseURL: env.FRONTEND_URL,
  basePath: "/api/v1/auth",
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: frontendOrigins,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: {
    modelName: "user",
    additionalFields: {
      accountStatus: {
        type: "string",
        required: false,
        defaultValue: "active",
        input: false,
      },
      accountStatusReason: {
        type: "string",
        required: false,
        input: false,
      },
      suspendedUntil: {
        type: "date",
        required: false,
        input: false,
      },
      firstName: {
        type: "string",
        required: true,
        input: true,
      },
      lastName: {
        type: "string",
        required: true,
        input: true,
      },
    },
  },
  session: {
    modelName: "authSession",
    expiresIn: env.BETTER_AUTH_SESSION_EXPIRES_IN_DAYS * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  account: {
    modelName: "authAccountBetter",
    encryptOAuthTokens: true,
  },
  verification: {
    modelName: "authVerification",
    storeInDatabase: true,
  },
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await assignDefaultCustomerRole(user.id);
        },
      },
    },
  },
  socialProviders: {
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            mapProfileToUser: getGoogleProfileNames,
          },
        }
      : {}),
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 10 * 60,
      allowedAttempts: 3,
      storeOTP: "hashed",
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        const subject = getOtpEmailSubject(type);

        await mailService.sendMail({
          to: email,
          ...createAuthenticationCodeEmail({
            subject,
            code: otp,
            purpose: getOtpPurpose(type),
            expiresInMinutes: 10,
          }),
        });
      },
    }),
    jwt({
      jwt: {
        expirationTime: `${env.BETTER_AUTH_JWT_EXPIRES_IN_SECONDS}s`,
      },
    }),
    bearer(),
    twoFactor({
      issuer: "Cartura",
      twoFactorTable: "authTwoFactor",
      twoFactorCookieMaxAge: 10 * 60,
      totpOptions: {
        disable: true,
      },
      otpOptions: {
        digits: 6,
        period: 10,
        allowedAttempts: 3,
        storeOTP: "hashed",
        async sendOTP({ user, otp }) {
          await mailService.sendMail({
            to: user.email,
            ...createAuthenticationCodeEmail({
              subject: "Verify your Cartura sign-in",
              code: otp,
              purpose: "Use this code to finish signing in.",
              expiresInMinutes: 10,
            }),
          });
        },
      },
    }),
    openAPI(),
  ],
});

function getOtpPurpose(
  type: "sign-in" | "email-verification" | "forget-password" | "change-email",
) {
  switch (type) {
    case "email-verification":
      return "Use this code to verify your email address.";
    case "forget-password":
      return "Use this code to reset your password.";
    case "change-email":
      return "Use this code to confirm your new email address.";
    default:
      return "Use this code to finish signing in.";
  }
}
