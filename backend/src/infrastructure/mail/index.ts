export { mailService, MailService } from "./mail.service.js";
export { createMailTransporter, mailTransporter } from "./mail.transporter.js";
export {
  createTransactionalEmail,
  escapeHtml,
  type TransactionalEmail,
  type TransactionalEmailDetail,
} from "./transactional-email.js";
export type { MailResult, SendMailInput } from "./mail.types.js";
