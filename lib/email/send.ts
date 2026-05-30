// Server-only transactional email via Resend. Per CLAUDE.md, RESEND_API_KEY
// runs server-side only (route handlers / server actions) and is read from the
// Vercel env in production. Degrades gracefully: when the key is unset (local /
// CI) sends are skipped and reported as not-sent rather than throwing.
import "server-only";

import { Resend } from "resend";

// The product lives at freecapt.com; links in emails are absolute.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://freecapt.com";
// Verified Resend sender (Supabase SMTP uses the same address).
const FROM = "FreeCapT <noreply@freecapt.com>";

let client: Resend | null = null;

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured.");
  client ??= new Resend(apiKey);
  return client;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export interface SendResult {
  sent: boolean;
  reason?: string;
}

// Build a sign-in link that lands the recipient on `next` after the magic link
// (the auth callback honours an explicit ?next=). Recipients always authenticate
// with their own email — we never embed a token in the link.
function signInLink(next: string): string {
  const url = new URL("/sign-in", SITE_URL);
  url.searchParams.set("next", next);
  return url.toString();
}

// Minimal, brand-consistent HTML shell. Inline styles only (email clients ignore
// <style>/Tailwind). Emerald = brand/action per the colour canon.
function shell(heading: string, bodyHtml: string, cta: { label: string; href: string }): string {
  return `<!doctype html><html><body style="margin:0;background:#f8fafc;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
      <tr><td style="padding:28px 32px 8px">
        <div style="font-size:16px;font-weight:700;letter-spacing:-0.01em">Free<span style="color:#059669">C</span>apT</div>
      </td></tr>
      <tr><td style="padding:8px 32px 0">
        <h1 style="margin:0;font-size:20px;font-weight:700;letter-spacing:-0.01em">${heading}</h1>
      </td></tr>
      <tr><td style="padding:12px 32px 0;font-size:14px;line-height:1.55;color:#334155">${bodyHtml}</td></tr>
      <tr><td style="padding:24px 32px 8px">
        <a href="${cta.href}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 18px;border-radius:8px">${cta.label}</a>
      </td></tr>
      <tr><td style="padding:16px 32px 28px;font-size:12px;line-height:1.5;color:#94a3b8">
        If the button doesn't work, copy this link into your browser:<br>
        <span style="color:#64748b;word-break:break-all">${cta.href}</span>
      </td></tr>
    </table>
    <div style="max-width:480px;margin:16px auto 0;font-size:12px;color:#94a3b8">FreeCapT — the free cap table. Operated by Bifrost Studios, Copenhagen.</div>
  </td></tr></table>
</body></html>`;
}

async function deliver(args: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendResult> {
  if (!isEmailConfigured()) {
    return { sent: false, reason: "email_not_configured" };
  }
  try {
    const { error } = await getResend().emails.send({
      from: FROM,
      to: args.to,
      subject: args.subject,
      html: args.html,
    });
    if (error) {
      console.error("[email] Resend error:", error);
      return { sent: false, reason: error.message };
    }
    return { sent: true };
  } catch (err) {
    console.error("[email] send threw:", err);
    return { sent: false, reason: "send_failed" };
  }
}

// Invite to co-manage a cap table (§5.13). Lands on /cap-table after sign-in.
export async function sendMemberInvite(args: {
  to: string;
  companyName: string;
  inviterName?: string | null;
  role: string;
}): Promise<SendResult> {
  const who = args.inviterName?.trim() ? args.inviterName.trim() : "Someone";
  const href = signInLink("/cap-table");
  const roleWord =
    args.role === "admin" ? "an admin" : args.role === "editor" ? "an editor" : "a viewer";
  const body = `<p style="margin:0 0 12px">${who} invited you to help manage the cap table for
    <strong>${args.companyName}</strong> on FreeCapT, as ${roleWord}.</p>
    <p style="margin:0">Sign in with this email address to accept — we'll send you a one-time link, no password needed.</p>`;
  return deliver({
    to: args.to,
    subject: `You're invited to ${args.companyName} on FreeCapT`,
    html: shell(`Join ${args.companyName}`, body, { label: "Accept the invite", href }),
  });
}

// Welcome a stakeholder to their portal after a grant is recorded (§5.7). Lands
// on /portfolio after sign-in, where their grant appears (matched by email).
export async function sendGrantWelcome(args: {
  to: string;
  companyName: string;
  stakeholderName?: string | null;
}): Promise<SendResult> {
  const first = args.stakeholderName?.trim().split(" ")[0];
  const hi = first ? `Hi ${first},` : "Hi,";
  const href = signInLink("/portfolio");
  const body = `<p style="margin:0 0 12px">${hi}</p>
    <p style="margin:0 0 12px"><strong>${args.companyName}</strong> has recorded equity for you on
    FreeCapT. You can see exactly what you hold, how it vests over time, and what it means — in plain English.</p>
    <p style="margin:0">Sign in with this email address to view your stake. We'll send a one-time link, no password needed.</p>`;
  return deliver({
    to: args.to,
    subject: `${args.companyName} has equity waiting for you`,
    html: shell("View your stake", body, { label: "View your stake", href }),
  });
}
