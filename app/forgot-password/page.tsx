"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, ArrowLeft, CheckCircle2, Copy, ExternalLink } from "lucide-react";
import AuthShell from "@/components/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [copied, setCopied]     = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res  = await fetch("/api/auth/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      // In dev mode the API returns the reset link directly
      setResetLink(data.resetLink ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    if (!resetLink) return;
    await navigator.clipboard.writeText(resetLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (resetLink !== null && !error) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="We've generated a password reset link for you."
        footer={
          <Link href="/login" className="text-primary-600 font-semibold hover:underline inline-flex items-center gap-1">
            <ArrowLeft size={13} /> Back to sign in
          </Link>
        }
      >
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
            <p className="text-sm text-surface-600 text-center">
              A reset link has been sent to <span className="font-semibold text-surface-900">{email}</span>.
              It expires in <span className="font-semibold">30 minutes</span>.
            </p>
          </div>

          {/* Dev mode: show the link directly so admins don't need SMTP */}
          {resetLink && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                🛠 Dev mode — no email sent
              </p>
              <p className="text-xs text-amber-600">
                SMTP is not configured yet. Share this link directly with the user:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs break-all text-amber-800 bg-amber-100 px-3 py-2 rounded-lg">
                  {resetLink}
                </code>
                <button
                  onClick={copyLink}
                  title="Copy link"
                  className="shrink-0 p-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-700 transition-colors"
                >
                  {copied ? <CheckCircle2 size={15} className="text-emerald-500" /> : <Copy size={15} />}
                </button>
                <a
                  href={resetLink}
                  target="_blank"
                  rel="noreferrer"
                  title="Open link"
                  className="shrink-0 p-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-700 transition-colors"
                >
                  <ExternalLink size={15} />
                </a>
              </div>
            </div>
          )}

          {/* If no resetLink returned (production), just show a generic success */}
          {!resetLink && (
            <p className="text-xs text-center text-surface-400">
              Didn&apos;t receive it? Check your spam folder or{" "}
              <button
                onClick={() => { setResetLink(null); }}
                className="text-primary-600 font-semibold hover:underline"
              >
                try again
              </button>.
            </p>
          )}
        </div>
      </AuthShell>
    );
  }

  // ── Request form ───────────────────────────────────────────────────────────
  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your work email and we'll generate a secure reset link."
      footer={
        <Link href="/login" className="text-primary-600 font-semibold hover:underline inline-flex items-center gap-1">
          <ArrowLeft size={13} /> Back to sign in
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <div className="form-error">{error}</div>}

        <div>
          <label className="field-label">Work email</label>
          <input
            id="forgot-email"
            className="field-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoFocus
            required
          />
        </div>

        <button
          id="btn-forgot-submit"
          type="submit"
          disabled={submitting}
          className="btn-primary btn-primary-block inline-flex items-center gap-2"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
          {submitting ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}
