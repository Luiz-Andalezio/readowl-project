// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import nodemailer from "nodemailer";

export type SendMailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
  attachments?: Array<{
    filename?: string;
    path?: string;
    content?: Buffer | string;
    contentType?: string;
    cid?: string; // for inline images
  }>;
};

type SimpleMailer = { sendMail: (opts: Record<string, unknown>) => Promise<unknown> };
let transporter: SimpleMailer | null = null;

function createTransport() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || undefined;
  const pass = process.env.SMTP_PASS || undefined;

  if (!host) {
    console.warn("[Mail] SMTP not configured (no host). Emails will be logged to console.");
    return null;
  }
  const transportOpts: Record<string, unknown> = {
    host,
    port,
    secure: port === 465,
  };
  if (user && pass) transportOpts.auth = { user, pass };
  transporter = nodemailer.createTransport(transportOpts) as SimpleMailer;
  return transporter;
}

export async function sendMail(params: SendMailParams) {
  const t = createTransport();
  if (!t) {
    console.info(`[Mail:DEV] to=${params.to} subject="${params.subject}"\n${params.html}`);
    return { dev: true };
  }
  try {
  const info = await t.sendMail({ from: process.env.MAIL_FROM || 'Readowl <no-reply@readowl.dev>', ...params });
    if (process.env.NODE_ENV !== 'production') {
      const rec = info as unknown as { messageId?: string; accepted?: unknown[]; rejected?: unknown[]; envelope?: unknown };
      console.info('[Mail] Sent', rec?.messageId ?? '(no id)');
      if (rec?.accepted || rec?.rejected) {
        console.info('[Mail] Accepted:', JSON.stringify(rec.accepted ?? []));
        if (rec.rejected && (rec.rejected as unknown[]).length) {
          console.warn('[Mail] Rejected:', JSON.stringify(rec.rejected));
        }
      }
    }
    return info as unknown;
  } catch (err) {
    console.error('[Mail] Send error', err);
    // Helpful guidance for common Gmail EAUTH/535 cases
    const e = err as { code?: string; responseCode?: number; response?: string };
    const looks535 = e?.responseCode === 535 || (e?.response || '').includes('535');
    const isAuthErr = e?.code === 'EAUTH';
    if (isAuthErr && looks535) {
      const host = process.env.SMTP_HOST ?? '';
      const user = process.env.SMTP_USER ?? '';
      const isGmail = /smtp\.gmail\.com/i.test(host) || /@gmail\.com$/i.test(user);
      if (isGmail) {
        console.error('[Mail] Tip: Gmail no longer accepts your normal password for SMTP.');
        console.error('[Mail]      Enable 2‑Step Verification on the account, then create an App Password');
        console.error('[Mail]      and set SMTP_PASS to that 16‑character App Password (no spaces).');
        console.error('[Mail]      Docs: https://support.google.com/accounts/answer/185833');
        console.error('[Mail]      Optional: use port 465 (secure) with SMTP_PORT=465.');
      }
    }
    throw err;
  }
}
