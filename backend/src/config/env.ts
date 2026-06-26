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
  BETTER_AUTH_URL: z.url().default("http://localhost:4000"),

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
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment variables:", z.treeifyError(result.error));

  process.exit(1);
}

export const env = result.data;
