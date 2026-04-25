import nodemailer, { type Transporter } from "nodemailer";

/**
 * Email transport.
 *
 * Configure via env vars (works with Gmail App Passwords out of the box):
 *   SMTP_HOST       (default: smtp.gmail.com)
 *   SMTP_PORT       (default: 465)
 *   SMTP_SECURE     (default: "true" — set "false" for STARTTLS / port 587)
 *   SMTP_USER       (your Gmail address)
 *   SMTP_PASS       (Gmail "App password" — generate at https://myaccount.google.com/apppasswords)
 *   SMTP_FROM       (display address, defaults to SMTP_USER)
 *   APP_URL         (overrides the auto-detected /join link host —
 *                    e.g. https://ftrm.vercel.app)
 *
 * URL detection: if APP_URL isn't set, we use Vercel's auto-injected
 * VERCEL_PROJECT_PRODUCTION_URL (production) or VERCEL_URL (previews),
 * falling back to http://localhost:3000 for local dev. So invitation
 * links always point at the deployment that sent them, with no manual
 * config required on Vercel.
 *
 * If SMTP_USER or SMTP_PASS is missing, the email helpers no-op and log a
 * warning so the API surface keeps working in environments without mail
 * (CI, local dev, preview).
 */

let cached: Transporter | null = null;

function getTransport(): Transporter | null {
  if (cached) return cached;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = (process.env.SMTP_SECURE ?? "true").toLowerCase() !== "false";

  cached = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  return cached;
}

export function emailEnabled(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function fromAddress(): string {
  return (
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    "no-reply@failure-to-role.local"
  );
}

/**
 * Resolve the public app URL used in invitation links.
 *
 * Priority (highest first):
 *   1. APP_URL                                   — explicit override
 *   2. VERCEL_PROJECT_PRODUCTION_URL (in prod)   — e.g. ftrm.vercel.app
 *   3. VERCEL_URL                                — per-deployment preview URL
 *   4. http://localhost:3000                     — local dev fallback
 */
function appUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");

  const prodHost =
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : null;
  const host = prodHost || process.env.VERCEL_URL;
  if (host) return `https://${host.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;

  return "http://localhost:3000";
}

interface InviteParams {
  to: string;
  code: string;
  organizationName: string;
  departmentName?: string | null;
  role: "EMPLOYEE" | "DEPT_HEAD";
  invitedByName: string;
  invitedByEmail: string;
  expiresAt: Date;
}

export async function sendInviteEmail(params: InviteParams): Promise<{ ok: boolean; reason?: string }> {
  const transport = getTransport();
  if (!transport) {
    console.warn("[email] SMTP not configured — invitation email skipped (code still works in /join).");
    return { ok: false, reason: "smtp_not_configured" };
  }

  const joinUrl = `${appUrl()}/join?code=${encodeURIComponent(params.code)}`;
  const roleLabel = params.role === "DEPT_HEAD" ? "Department Head" : "Team Member";
  const deptLine = params.departmentName ? ` in <strong>${escapeHtml(params.departmentName)}</strong>` : "";
  const deptLineText = params.departmentName ? ` in ${params.departmentName}` : "";

  const subject = `You've been invited to ${params.organizationName} on Failure-to-Role`;
  const text = [
    `Hi,`,
    ``,
    `${params.invitedByName} (${params.invitedByEmail}) has invited you to join "${params.organizationName}"${deptLineText} as a ${roleLabel} on the Failure-to-Role Mapping platform.`,
    ``,
    `Your invite code: ${params.code}`,
    `Redeem here:    ${joinUrl}`,
    ``,
    `This invite expires on ${params.expiresAt.toUTCString()}.`,
    ``,
    `If you weren't expecting this email, you can safely ignore it.`,
  ].join("\n");

  const html = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#f6f7fb;padding:32px 16px;color:#0f172a;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:28px 32px;color:#ffffff;">
        <p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.85;">Failure-to-Role Mapping</p>
        <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;">You've been invited</h1>
      </div>
      <div style="padding:32px;">
        <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#334155;">
          <strong>${escapeHtml(params.invitedByName)}</strong>
          (<a href="mailto:${escapeHtml(params.invitedByEmail)}" style="color:#4f46e5;text-decoration:none;">${escapeHtml(params.invitedByEmail)}</a>)
          has invited you to join <strong>${escapeHtml(params.organizationName)}</strong>${deptLine} as a <strong>${escapeHtml(roleLabel)}</strong>.
        </p>
        <div style="margin:24px 0;padding:18px 20px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:14px;text-align:center;">
          <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#64748b;font-weight:600;">Your invite code</p>
          <p style="margin:0;font-family:'SFMono-Regular',Consolas,'Liberation Mono',monospace;font-size:22px;letter-spacing:0.18em;color:#0f172a;font-weight:700;">${escapeHtml(params.code)}</p>
        </div>
        <div style="text-align:center;margin:28px 0 8px;">
          <a href="${joinUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 26px;border-radius:12px;">
            Accept invitation
          </a>
        </div>
        <p style="margin:16px 0 0;font-size:12px;color:#64748b;line-height:1.5;text-align:center;">
          Or paste the code at <a href="${appUrl()}/join" style="color:#4f46e5;text-decoration:none;">${appUrl()}/join</a>.<br/>
          This invite expires on <strong>${params.expiresAt.toUTCString()}</strong>.
        </p>
      </div>
      <div style="padding:14px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:11px;text-align:center;">
        If you weren't expecting this, you can safely ignore this email.
      </div>
    </div>
  </div>`;

  try {
    await transport.sendMail({
      from: fromAddress(),
      to: params.to,
      subject,
      text,
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("[email] Failed to send invitation:", err);
    return { ok: false, reason: err instanceof Error ? err.message : "send_failed" };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
