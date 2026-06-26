import nodemailer from "nodemailer";

import { env } from "../../config/env.js";

export function createMailTransporter() {
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    ...(env.SMTP_USER && env.SMTP_PASS
      ? {
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
        }
      : {}),
  });
}

export const mailTransporter = createMailTransporter();
