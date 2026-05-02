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

// Use plain ASCII display names — special chars in From can trigger spam filters
const NOREPLY_FROM = process.env.EMAIL_FROM || "Docs Squared <noreply@docsquared.app>";
const SUPPORT_FROM = "Docs Squared Support <support@docsquared.app>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://docsquared.app";

export async function sendVerificationEmail(opts: {
  to: string;
  url: string;
  name?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const r = getResend();
  if (!r) {
    console.warn(`[Email] RESEND_API_KEY not set. Verification URL for ${opts.to}: ${opts.url}`);
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }
  const { error } = await r.emails.send({
    from: NOREPLY_FROM,
    to: opts.to,
    subject: "Verify your email for Docs²",
    html: `<!DOCTYPE html>
<html><body style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="font-size: 24px; margin: 0; color: #4A90D2;">Docs<sup>2</sup></h1>
    <p style="color: #71717a; font-size: 12px; margin: 4px 0 0;">Docs for Docs</p>
  </div>
  <h2 style="font-size: 20px;">Verify your email</h2>
  <p>Hi${opts.name ? ` ${opts.name}` : ""},</p>
  <p>Click the button below to verify your email and finish creating your Docs<sup>2</sup> account.</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="${opts.url}" style="display: inline-block; background: #4A90D2; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Verify email</a>
  </div>
  <p style="color: #71717a; font-size: 14px;">Or copy and paste this URL: <br/><code style="font-size: 12px; word-break: break-all;">${opts.url}</code></p>
  <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 32px 0;" />
  <p style="color: #71717a; font-size: 12px;">If you didn't sign up for Docs Squared, you can ignore this email.</p>
</body></html>`,
    text: `Verify your email for Docs Squared\n\nHi${opts.name ? ` ${opts.name}` : ""},\n\nClick this link to verify your email: ${opts.url}\n\nIf you didn't sign up for Docs Squared, you can ignore this email.`,
  });
  if (error) {
    console.error("[Email] Verification send failed:", error);
    return { ok: false, error: error.message || "Send failed" };
  }
  return { ok: true };
}

export async function sendPasswordResetEmail(opts: {
  to: string;
  url: string;
  name?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const r = getResend();
  if (!r) return { ok: false, error: "RESEND_API_KEY not configured" };
  const { error } = await r.emails.send({
    from: NOREPLY_FROM,
    to: opts.to,
    subject: "Reset your Docs Squared password",
    html: `<!DOCTYPE html>
<html><body style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 24px; margin: 0 0 16px; color: #4A90D2;">Docs<sup>2</sup></h1>
  <h2 style="font-size: 20px;">Reset your password</h2>
  <p>Hi${opts.name ? ` ${opts.name}` : ""},</p>
  <p>Click the button below to reset your password. This link expires in 1 hour.</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="${opts.url}" style="display: inline-block; background: #4A90D2; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reset password</a>
  </div>
  <p style="color: #71717a; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
</body></html>`,
    text: `Reset your Docs Squared password\n\nClick this link: ${opts.url}\n\nLink expires in 1 hour.`,
  });
  if (error) return { ok: false, error: error.message || "Send failed" };
  return { ok: true };
}

/** Send a reply from support@docsquared.app (e.g., when answering inbound mail). */
export async function sendSupportReply(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  inReplyTo?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const r = getResend();
  if (!r) return { ok: false, error: "RESEND_API_KEY not configured" };
  const { error } = await r.emails.send({
    from: SUPPORT_FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    headers: opts.inReplyTo ? { "In-Reply-To": opts.inReplyTo } : undefined,
  });
  if (error) return { ok: false, error: error.message || "Send failed" };
  return { ok: true };
}

/**
 * Send a credit-usage warning when a user crosses 80% of their monthly limit.
 * Includes a usage bar, remaining credits, and an upgrade CTA for free/pro users.
 */
export async function sendCreditWarningEmail(opts: {
  email: string;
  name: string;
  used: number;
  limit: number;
  plan: string;
}): Promise<{ ok: boolean; error?: string }> {
  const r = getResend();
  if (!r) {
    console.warn(
      `[Email] RESEND_API_KEY not set. Credit warning for ${opts.email}: ${opts.used}/${opts.limit}`
    );
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const remaining = Math.max(0, opts.limit - opts.used);
  const pct = Math.min(100, Math.round((opts.used / opts.limit) * 100));
  const showUpgrade = opts.plan === "free" || opts.plan === "pro";
  const pricingUrl = `${APP_URL}/pricing`;

  const upgradeCta = showUpgrade
    ? `<div style="text-align: center; margin: 32px 0;">
        <a href="${pricingUrl}" style="display: inline-block; background: #4A90D2; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Upgrade your plan</a>
      </div>
      <p style="text-align: center; color: #71717a; font-size: 14px;">Upgrade for more credits and unlock your full workflow.</p>`
    : "";

  const upgradeText = showUpgrade
    ? `\nUpgrade your plan: ${pricingUrl}\n`
    : "";

  const { error } = await r.emails.send({
    from: NOREPLY_FROM,
    to: opts.email,
    subject: "You've used 80% of your monthly credits",
    html: `<!DOCTYPE html>
<html><body style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="font-size: 24px; margin: 0; color: #4A90D2;">Docs<sup>2</sup></h1>
    <p style="color: #71717a; font-size: 12px; margin: 4px 0 0;">Docs for Docs</p>
  </div>
  <h2 style="font-size: 20px;">You've used ${pct}% of your monthly credits</h2>
  <p>Hi${opts.name ? ` ${opts.name}` : ""},</p>
  <p>You've used <strong>${opts.used}</strong> of your <strong>${opts.limit}</strong> monthly credits on the <strong>${opts.plan}</strong> plan.</p>
  <!-- Usage bar -->
  <div style="background: #e4e4e7; border-radius: 8px; height: 24px; overflow: hidden; margin: 24px 0;">
    <div style="background: #4A90D2; height: 100%; width: ${pct}%; border-radius: 8px; transition: width 0.3s;"></div>
  </div>
  <p style="text-align: center; color: #71717a; font-size: 14px;"><strong>${remaining}</strong> credit${remaining === 1 ? "" : "s"} remaining this month</p>
  ${upgradeCta}
  <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 32px 0;" />
  <p style="color: #71717a; font-size: 12px;">You're receiving this because you've crossed 80% of your monthly credit allowance on Docs Squared. We only send this once per billing cycle.</p>
</body></html>`,
    text: `You've used ${pct}% of your monthly credits\n\nHi${opts.name ? ` ${opts.name}` : ""},\n\nYou've used ${opts.used} of your ${opts.limit} monthly credits on the ${opts.plan} plan.\n${remaining} credit${remaining === 1 ? "" : "s"} remaining this month.\n${upgradeText}\nYou're receiving this because you've crossed 80% of your monthly credit allowance on Docs Squared. We only send this once per billing cycle.`,
  });
  if (error) {
    console.error("[Email] Credit warning send failed:", error);
    return { ok: false, error: error.message || "Send failed" };
  }
  return { ok: true };
}
