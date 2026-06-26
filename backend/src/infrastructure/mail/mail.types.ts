export type SendMailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export type MailResult = {
  messageId: string;
};
