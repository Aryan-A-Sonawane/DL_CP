"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, KeyRound, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";
import AuthShell from "@/components/AuthShell";

function ResetForm() {
  const params   = useSearchParams();
  const router   = useRouter();
  const token    = params.get("token") ?? "";

  const [password, setPassword]   = useState("");
  const [confirm,  setConfirm]    = useState("");
  const [showPw,   setShowPw]     = useState(false);
  const [showCf,   setShowCf]     = useState(false);
  const [busy,     setBusy]       = useState(false);
  const [error,    setError]      = useState<string | null>(null);
  const [done,     setDone]       = useState(false);

  const strength = (() => {
    if (password.length === 0) return null;
    let score = 0;
    if (password.length >= 8)  score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return { label: "Weak",   color: "bg-red-400",    text: "text-red-500",    w: "w-1/4" };
    if (score <= 2) return { label: "Fair",   color: "bg-amber-400",  text: "text-amber-500",  w: "w-2/4" };
    if (score <= 3) return { label: "Good",   color: "bg-emerald-400",text: "text-emerald-500",w: "w-3/4" };
    return                { label: "Strong", color: "bg-emerald-500",text: "text-emerald-600",w: "w-full" };
  })();

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-surface-500">Invalid reset link — no token found.</p>
        <Link href="/forgot-password" className="btn-primary inline-flex items-center gap-2">
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-5 text-center">
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 size={28} className="text-emerald-500" />
          </div>
          <h3 className="font-bold text-surface-900">Password updated!</h3>
          <p className="text-sm text-surface-500">You can now sign in with your new password.</p>
        </div>
        <button onClick={() => router.push("/login")} className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft size={14} /> Go to sign in
        </button>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters."); return; }
    setBusy(true);
    try {
      const res  = await fetch("/api/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Reset failed");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && <div className="form-error">{error}</div>}

      {/* New password */}
      <div>
        <label className="field-label">New password</label>
        <div className="relative">
          <input
            id="reset-password"
            className="field-input field-input-icon"
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            autoFocus
            required
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Strength meter */}
        {strength && (
          <div className="mt-2 space-y-1">
            <div className="h-1.5 rounded-full bg-surface-100 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${strength.color} ${strength.w}`} />
            </div>
            <p className={`text-xs font-medium ${strength.text}`}>{strength.label}</p>
          </div>
        )}
      </div>

      {/* Confirm password */}
      <div>
        <label className="field-label">Confirm password</label>
        <div className="relative">
          <input
            id="reset-confirm"
            className="field-input field-input-icon"
            type={showCf ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat password"
            required
          />
          <button
            type="button"
            onClick={() => setShowCf((v) => !v)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
          >
            {showCf ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {confirm && password !== confirm && (
          <p className="mt-1 text-xs text-red-500">Passwords don&apos;t match.</p>
        )}
      </div>

      <button
        id="btn-reset-submit"
        type="submit"
        disabled={busy}
        className="btn-primary btn-primary-block inline-flex items-center gap-2"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
        {busy ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a strong password. The link expires in 30 minutes."
      footer={
        <Link href="/login" className="text-primary-600 font-semibold hover:underline inline-flex items-center gap-1">
          <ArrowLeft size={13} /> Back to sign in
        </Link>
      }
    >
      <Suspense fallback={<div className="text-sm text-surface-400">Loading…</div>}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
