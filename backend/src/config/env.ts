import "dotenv/config";
import { z } from "zod";

const DEVELOPMENT_AUTH_SECRET = "development-better-auth-secret-change-me";
const optionalUrlSchema = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim().length === 0 ? undefined : value,
  z.url().optional(),
);

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    PORT: z.coerce.number().int().positive().default(4000),

    DATABASE_URL: z.string().min(1),

    FRONTEND_URL: z.url().default("http://localhost:3000"),
    CORS_ORIGINS: z
      .string()
      .default("")
      .transform((value) =>
        value
          .split(",")
          .map((origin) => origin.trim())
          .filter(Boolean),
      )
      .pipe(z.array(z.url())),

    BETTER_AUTH_SECRET: z.string().min(32).default(DEVELOPMENT_AUTH_SECRET),

    BETTER_AUTH_JWT_EXPIRES_IN_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(900),
    BETTER_AUTH_SESSION_EXPIRES_IN_DAYS: z.coerce
      .number()
      .int()
      .positive()
      .default(30),
    SUPER_ADMIN_BOOTSTRAP_ENABLED: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .default(true),
    SUPER_ADMIN_EMAIL: z.email().toLowerCase().default("admin@cartura.test"),
    SUPER_ADMIN_FIRST_NAME: z.string().trim().min(1).max(80).default("Cartura"),
    SUPER_ADMIN_LAST_NAME: z.string().trim().min(1).max(80).default("Admin"),
    SUPER_ADMIN_PASSWORD: z.string().max(128).default(""),
    DEV_SEED_PASSWORD: z.string().min(8).max(128).default("CarturaDev123!"),
    EMAIL_VERIFICATION_EXPIRES_IN_HOURS: z.coerce
      .number()
      .int()
      .positive()
      .default(24),
    PASSWORD_RESET_EXPIRES_IN_MINUTES: z.coerce
      .number()
      .int()
      .positive()
      .default(30),

    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    MAIL_FROM: z.string().min(1).default("Cartura <no-reply@cartura.local>"),
    SMTP_HOST: z.string().default("smtp.gmail.com"),
    SMTP_PORT: z.coerce.number().int().positive().default(465),
    SMTP_SECURE: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .default(true),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),

    CLOUDINARY_CLOUD_NAME: z.string().default(""),
    CLOUDINARY_API_KEY: z.string().default(""),
    CLOUDINARY_API_SECRET: z.string().default(""),
    CLOUDINARY_UPLOAD_FOLDER: z.string().min(1).default("cartura"),
    MEDIA_PENDING_TTL_HOURS: z.coerce.number().int().positive().default(24),
    MEDIA_DELETE_CLAIM_TTL_MINUTES: z.coerce
      .number()
      .int()
      .positive()
      .default(15),

    PAYMOB_BASE_URL: z.url().default("https://accept.paymob.com"),
    PAYMOB_API_KEY: z.string().default(""),
    PAYMOB_SECRET_KEY: z.string().default(""),
    PAYMOB_PUBLIC_KEY: z.string().default(""),
    PAYMOB_HMAC_SECRET: z.string().default(""),
    PAYMOB_CARD_INTEGRATION_ID: z.string().default(""),
    PAYMOB_WEBHOOK_URL: optionalUrlSchema,
    PAYMOB_REDIRECTION_URL: optionalUrlSchema,
    PAYMOB_INTENTION_EXPIRATION_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(3600),
    PAYMOB_REFUND_ENDPOINT: z.string().trim().default(""),

    REDIS_URL: z.string().trim().default(""),
    REDIS_CACHE_ENABLED: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .default(true),
    REDIS_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(60),
    BULLMQ_PREFIX: z.string().trim().min(1).default("cartura"),
    RATE_LIMIT_ENABLED: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .default(true),
    RATE_LIMIT_REDIS_PREFIX: z.string().trim().min(1).default("cartura:rl:api"),
    TRUST_PROXY: z.string().trim().default(""),
    INTERNAL_API_AUTH_MODE: z
      .enum(["vercel-oidc", "shared-secret", "disabled"])
      .default("disabled"),
    INTERNAL_API_SHARED_SECRET: z.string().default(""),
    VERCEL_OIDC_ISSUER: optionalUrlSchema,
    VERCEL_OIDC_AUDIENCE: z.string().trim().default(""),
    VERCEL_OIDC_SUBJECT: z.string().trim().default(""),

    BACKGROUND_WORKERS_ENABLED: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .default(true),
    OUTBOX_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(5000),
    NOTIFICATION_DELIVERY_POLL_INTERVAL_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(10000),
    STALE_ORDER_POLL_INTERVAL_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(60000),
    STALE_ORDER_BATCH_SIZE: z.coerce.number().int().positive().default(25),
    MEDIA_CLEANUP_POLL_INTERVAL_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(3_600_000),
    MEDIA_CLEANUP_BATCH_SIZE: z.coerce.number().int().positive().default(100),
  })
  .superRefine((values, context) => {
    if (
      values.NODE_ENV === "production" &&
      values.BETTER_AUTH_SECRET === DEVELOPMENT_AUTH_SECRET
    ) {
      context.addIssue({
        code: "custom",
        message: "BETTER_AUTH_SECRET must be configured in production",
        path: ["BETTER_AUTH_SECRET"],
      });
    }

    if (values.NODE_ENV === "production" && !isHttpsUrl(values.FRONTEND_URL)) {
      context.addIssue({
        code: "custom",
        message: "FRONTEND_URL must use HTTPS in production",
        path: ["FRONTEND_URL"],
      });
    }

    if (
      values.NODE_ENV === "production" &&
      values.CORS_ORIGINS.some((origin) => !isHttpsUrl(origin))
    ) {
      context.addIssue({
        code: "custom",
        message: "CORS_ORIGINS must use HTTPS in production",
        path: ["CORS_ORIGINS"],
      });
    }

    if (
      values.NODE_ENV === "production" &&
      values.BACKGROUND_WORKERS_ENABLED &&
      !values.REDIS_URL
    ) {
      context.addIssue({
        code: "custom",
        message: "REDIS_URL is required when background workers are enabled",
        path: ["REDIS_URL"],
      });
    }

    if (values.REDIS_URL && !isRedisUrl(values.REDIS_URL)) {
      context.addIssue({
        code: "custom",
        message: "REDIS_URL must use the redis or rediss protocol",
        path: ["REDIS_URL"],
      });
    }

    if (
      values.NODE_ENV === "production" &&
      values.RATE_LIMIT_ENABLED &&
      !values.REDIS_URL
    ) {
      context.addIssue({
        code: "custom",
        message: "REDIS_URL is required when production rate limiting is enabled",
        path: ["REDIS_URL"],
      });
    }

    if (
      values.NODE_ENV === "production" &&
      values.INTERNAL_API_AUTH_MODE === "disabled"
    ) {
      context.addIssue({
        code: "custom",
        message: "INTERNAL_API_AUTH_MODE cannot be disabled in production",
        path: ["INTERNAL_API_AUTH_MODE"],
      });
    }

    if (
      values.INTERNAL_API_AUTH_MODE === "shared-secret" &&
      values.INTERNAL_API_SHARED_SECRET.length < 32
    ) {
      context.addIssue({
        code: "custom",
        message: "INTERNAL_API_SHARED_SECRET must be at least 32 characters",
        path: ["INTERNAL_API_SHARED_SECRET"],
      });
    }

    if (values.INTERNAL_API_AUTH_MODE === "vercel-oidc") {
      for (const [name, value] of [
        ["VERCEL_OIDC_ISSUER", values.VERCEL_OIDC_ISSUER],
        ["VERCEL_OIDC_AUDIENCE", values.VERCEL_OIDC_AUDIENCE],
        ["VERCEL_OIDC_SUBJECT", values.VERCEL_OIDC_SUBJECT],
      ] as const) {
        if (!value) {
          context.addIssue({
            code: "custom",
            message: `${name} is required for Vercel OIDC`,
            path: [name],
          });
        }
      }
    }

    for (const [name, value] of [
      ["PAYMOB_BASE_URL", values.PAYMOB_BASE_URL],
      ["PAYMOB_WEBHOOK_URL", values.PAYMOB_WEBHOOK_URL],
      ["PAYMOB_REDIRECTION_URL", values.PAYMOB_REDIRECTION_URL],
    ] as const) {
      if (values.NODE_ENV === "production" && value && !isHttpsUrl(value)) {
        context.addIssue({
          code: "custom",
          message: `${name} must use HTTPS in production`,
          path: [name],
        });
      }
    }

    addPairedConfigurationIssue(
      context,
      "GOOGLE_CLIENT_ID",
      values.GOOGLE_CLIENT_ID,
      "GOOGLE_CLIENT_SECRET",
      values.GOOGLE_CLIENT_SECRET,
    );
    addPairedConfigurationIssue(
      context,
      "SMTP_USER",
      values.SMTP_USER,
      "SMTP_PASS",
      values.SMTP_PASS,
    );

    const cloudinaryValues = [
      values.CLOUDINARY_CLOUD_NAME,
      values.CLOUDINARY_API_KEY,
      values.CLOUDINARY_API_SECRET,
    ];
    const configuredCloudinaryValues = cloudinaryValues.filter(Boolean).length;

    if (
      configuredCloudinaryValues > 0 &&
      configuredCloudinaryValues < cloudinaryValues.length
    ) {
      context.addIssue({
        code: "custom",
        message:
          "Cloudinary cloud name, API key, and API secret must be configured together",
        path: ["CLOUDINARY_CLOUD_NAME"],
      });
    }
  });

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment variables:", z.treeifyError(result.error));

  process.exit(1);
}

export const env = result.data;

export const frontendOrigins = [
  ...new Set([env.FRONTEND_URL, ...env.CORS_ORIGINS]),
];

function addPairedConfigurationIssue(
  context: z.RefinementCtx,
  firstName: string,
  firstValue: string | undefined,
  secondName: string,
  secondValue: string | undefined,
): void {
  if (Boolean(firstValue) === Boolean(secondValue)) {
    return;
  }

  context.addIssue({
    code: "custom",
    message: `${firstName} and ${secondName} must be configured together`,
    path: [firstValue ? secondName : firstName],
  });
}

function isRedisUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "redis:" || protocol === "rediss:";
  } catch {
    return false;
  }
}

function isHttpsUrl(value: string): boolean {
  return new URL(value).protocol === "https:";
}
