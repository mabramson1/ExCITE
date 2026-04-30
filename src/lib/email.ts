import { Resend } from "resend";

/**
 * Resend email client — lazy-initialized so module loads without RESEND_API_KEY.
 * If the key is missing, sends become no-ops with a console.warn.
 */
let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = process.env.EMAIL_FROM || "Docs² <noreply@docsquared.app>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://docsquared.app";

export async function sendVerificationEmail(opts: {
  to: string;
  url: string;
  name?: string;
}): Promise<void> {
  const r = getResend();
  if (!r) {
    console.warn(`[Email] RESEND_API_KEY not set. Verification URL for ${opts.to}: ${opts.url}`);
    return;
  }
  const { error } = await r.emails.send({
    from: FROM,
    to: opts.to,
    subject: "Verify your email for Docs²",
    html: `<!DOCTYPE html>
<html><body style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="font-size: 24px; margin: 0; color: #0f4c81;">Docs²</h1>
    <p style="color: #71717a; font-size: 12px; margin: 4px 0 0;">Docs for Docs</p>
  </div>
  <h2 style="font-size: 20px;">Verify your email</h2>
  <p>Hi${opts.name ? ` ${opts.name}` : ""},</p>
  <p>Click the button below to verify your email and finish creating your Docs² account.</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="${opts.url}" style="display: inline-block; background: #0f4c81; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Verify email</a>
  </div>
  <p style="color: #71717a; font-size: 14px;">Or copy and paste this URL: <br/><code style="font-size: 12px; word-break: break-all;">${opts.url}</code></p>
  <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 32px 0;" />
  <p style="color: #71717a; font-size: 12px;">If you didn't sign up for Docs², you can ignore this email.</p>
</body></html>`,
    text: `Verify your email for Docs²\n\nHi${opts.name ? ` ${opts.name}` : ""},\n\nClick this link to verify your email: ${opts.url}\n\nIf you didn't sign up for Docs², you can ignore this email.`,
  });
  if (error) console.error("[Email] Verification send failed:", error);
}

export async function sendPasswordResetEmail(opts: {
  to: string;
  url: string;
  name?: string;
}): Promise<void> {
  const r = getResend();
  if (!r) {
    console.warn(`[Email] RESEND_API_KEY not set. Reset URL for ${opts.to}: ${opts.url}`);
    return;
  }
  const { error } = await r.emails.send({
    from: FROM,
    to: opts.to,
    subject: "Reset your Docs² password",
    html: `<!DOCTYPE html>
<html><body style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="font-size: 24px; margin: 0; color: #0f4c81;">Docs²</h1>
  </div>
  <h2 style="font-size: 20px;">Reset your password</h2>
  <p>Hi${opts.name ? ` ${opts.name}` : ""},</p>
  <p>Click the button below to reset your Docs² password. This link expires in 1 hour.</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="${opts.url}" style="display: inline-block; background: #0f4c81; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reset password</a>
  </div>
  <p style="color: #71717a; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
</body></html>`,
    text: `Reset your Docs² password\n\nClick this link to reset: ${opts.url}\n\nLink expires in 1 hour. If you didn't request this, ignore this email.`,
  });
  if (error) console.error("[Email] Reset send failed:", error);
}

void APP_URL;
