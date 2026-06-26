import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { openAPI, twoFactor } from "better-auth/plugins";
import { bearer } from "better-auth/plugins/bearer";
import { emailOTP } from "better-auth/plugins/email-otp";
import { jwt } from "better-auth/plugins/jwt";

import { env } from "../../config/env.js";
import { prisma } from "../../infrastructure/database/prisma.js";
import { mailService } from "../../infrastructure/mail/index.js";
import { assignDefaultCustomerRole } from "../authorization/authorization.provisioning.js";

import { getOtpEmailSubject } from "./auth.utils.js";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/v1/auth",
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.FRONTEND_URL],
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
        await mailService.sendMail({
          to: email,
          subject: getOtpEmailSubject(type),
          text: `Your Cartura code is ${otp}. It expires in 10 minutes.`,
          html: `<p>Your Cartura code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
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
            subject: "Verify your Cartura sign-in",
            text: `Your Cartura sign-in code is ${otp}. It expires in 10 minutes.`,
            html: `<p>Your Cartura sign-in code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
          });
        },
      },
    }),
    openAPI(),
  ],
});
