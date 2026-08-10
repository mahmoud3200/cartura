export type TransactionalEmail = {
  subject: string;
  text: string;
  html: string;
};

export type TransactionalEmailDetail = {
  label: string;
  value: string;
};

export function createTransactionalEmail(input: {
  subject: string;
  preheader: string;
  heading: string;
  body: string;
  action?: {
    label: string;
    url: string;
  };
  details?: TransactionalEmailDetail[];
  footer?: string;
}): TransactionalEmail {
  const details = input.details ?? [];
  const footer =
    input.footer ??
    "You received this transactional email because of activity on your Cartura account.";
  const textLines = [
    input.heading,
    "",
    input.body,
    ...details.flatMap((detail) => ["", `${detail.label}: ${detail.value}`]),
    ...(input.action ? ["", `${input.action.label}: ${input.action.url}`] : []),
    "",
    footer,
  ];

  return {
    subject: input.subject,
    text: textLines.join("\n"),
    html: renderEmailHtml({
      ...input,
      details,
      footer,
    }),
  };
}

function renderEmailHtml(input: {
  preheader: string;
  heading: string;
  body: string;
  action?: {
    label: string;
    url: string;
  };
  details: TransactionalEmailDetail[];
  footer: string;
}) {
  const detailRows = input.details
    .map(
      (detail) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e7e5e4;color:#78716c;font-size:13px;line-height:20px;vertical-align:top;width:38%;">${escapeHtml(detail.label)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e7e5e4;color:#1c1917;font-size:13px;font-weight:600;line-height:20px;vertical-align:top;">${escapeHtml(detail.value)}</td>
        </tr>`,
    )
    .join("");
  const detailsTable = detailRows
    ? `
      <tr>
        <td style="padding:0 32px 24px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e7e5e4;border-radius:8px;border-collapse:separate;border-spacing:0;">
            ${detailRows}
          </table>
        </td>
      </tr>`
    : "";
  const actionRow = input.action
    ? `
      <tr>
        <td style="padding:0 32px 30px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td bgcolor="#1c1917" style="border-radius:8px;">
                <a href="${escapeAttribute(input.action.url)}" style="display:inline-block;padding:12px 18px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;line-height:20px;text-decoration:none;">${escapeHtml(input.action.label)}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <title>${escapeHtml(input.heading)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f5f5f4;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(input.preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#f5f5f4;">
      <tr>
        <td align="center" style="padding:32px 12px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #e7e5e4;border-radius:12px;border-collapse:separate;border-spacing:0;">
            <tr>
              <td style="padding:28px 32px 12px;color:#57534e;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;letter-spacing:1.2px;line-height:18px;text-transform:uppercase;">Cartura</td>
            </tr>
            <tr>
              <td style="padding:0 32px 12px;color:#1c1917;font-family:Arial,Helvetica,sans-serif;font-size:26px;font-weight:700;line-height:34px;">${escapeHtml(input.heading)}</td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px;color:#57534e;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;">${escapeHtml(input.body)}</td>
            </tr>
            ${detailsTable}
            ${actionRow}
            <tr>
              <td style="padding:20px 32px 28px;border-top:1px solid #e7e5e4;color:#78716c;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:19px;">${escapeHtml(input.footer)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
