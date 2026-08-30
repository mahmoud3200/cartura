import { createTransactionalEmail } from "../../infrastructure/mail/index.js";

export function createAuthenticationCodeEmail(input: {
  subject: string;
  code: string;
  purpose: string;
  expiresInMinutes: number;
}) {
  return createTransactionalEmail({
    subject: input.subject,
    preheader: `${input.purpose} This code expires soon.`,
    heading: input.subject,
    body: `${input.purpose} Enter the code below. It expires in ${input.expiresInMinutes} minutes.`,
    details: [{ label: "Security code", value: input.code }],
    footer:
      "If you did not request this code, you can ignore this email. Never share a security code with anyone.",
  });
}
