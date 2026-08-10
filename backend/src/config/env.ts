import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1),

  FRONTEND_URL: z.url().default("http://localhost:3000"),

  BETTER_AUTH_SECRET: z
    .string()
    .min(32)
    .default("development-better-auth-secret-change-me"),

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
  SUPER_ADMIN_EMAIL: z
    .email()
    .toLowerCase()
    .default("deifmahmoud320@gmail.com"),
  SUPER_ADMIN_FIRST_NAME: z.string().trim().min(1).max(80).default("Deif"),
  SUPER_ADMIN_LAST_NAME: z.string().trim().min(1).max(80).default("Mahmoud"),
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

  PAYMOB_BASE_URL: z.url().default("https://accept.paymob.com"),
  PAYMOB_API_KEY: z.string().default(""),
  PAYMOB_SECRET_KEY: z.string().default(""),
  PAYMOB_PUBLIC_KEY: z.string().default(""),
  PAYMOB_HMAC_SECRET: z.string().default(""),
  PAYMOB_CARD_INTEGRATION_ID: z.string().default(""),
  PAYMOB_WEBHOOK_URL: z.url().optional(),
  PAYMOB_REDIRECTION_URL: z.url().optional(),
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
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment variables:", z.treeifyError(result.error));

  process.exit(1);
}

export const env = result.data;

export const frontendOrigins = [
  env.FRONTEND_URL,
  // Temporary: remove after external dev-tunnel testing is finished.
  "https://qf0xcs7f-3000.uks1.devtunnels.ms",
];
