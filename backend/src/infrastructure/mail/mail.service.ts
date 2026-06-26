import { env } from "../../config/env.js";
import type { MailResult, SendMailInput } from "./mail.types.js";
import { mailTransporter } from "./mail.transporter.js";

export class MailService {
  async sendMail(input: SendMailInput): Promise<MailResult> {
    if (!env.SMTP_USER || !env.SMTP_PASS) {
      throw new Error("SMTP credentials are not configured");
    }

    const result = await mailTransporter.sendMail({
      from: env.MAIL_FROM,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
    });

    return {
      messageId: result.messageId,
    };
  }

  async verifyConnection(): Promise<boolean> {
    return mailTransporter.verify();
  }
}

export const mailService = new MailService();
