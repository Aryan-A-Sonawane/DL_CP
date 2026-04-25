"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, Copy, Check } from "lucide-react";

export default function DeptInviteButton({ departmentId }: { departmentId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<"sent" | "skipped" | "failed" | null>(null);
  const [reuseSummary, setReuseSummary] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: "EMPLOYEE", departmentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invite failed");
      if (data.reused) {
        setReuseSummary(data.summary || "Existing user updated.");
      } else {
        setCode(data.code);
        setEmailStatus(data.emailStatus ?? "skipped");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setSubmitting(false);
    }
  }

  function close() {
    setOpen(false);
    setEmail("");
    setCode(null);
    setEmailStatus(null);
    setReuseSummary(null);
    setError(null);
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary inline-flex items-center gap-2">
        <UserPlus size={14} />
        Invite employee
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/40 backdrop-blur-sm p-4">
          <div className="card max-w-md w-full p-7 animate-slide-up">
            <h3 className="text-lg font-bold text-surface-900">Invite an employee</h3>
            {reuseSummary ? (
              <div className="mt-5 space-y-4">
                <div className="form-success">
                  {reuseSummary}. They&apos;ll see the change next time they
                  refresh — no email or code needed since they already have an
                  account.
                </div>
                <button onClick={close} className="btn-primary btn-primary-block">
                  Done
                </button>
              </div>
            ) : code ? (
              <div className="mt-5 space-y-4">
                <div className="form-success">
                  {emailStatus === "sent"
                    ? `Invitation emailed to ${email}. Code below works as a backup — it expires in 14 days.`
                    : emailStatus === "failed"
                      ? "Invitation created, but the email failed to send. Share the code manually below."
                      : "Invitation created. SMTP isn't configured yet — share this code manually. It expires in 14 days."}
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-xl bg-surface-50 border border-surface-200 px-4 py-3 font-mono text-lg tracking-widest text-surface-900 text-center">
                    {code}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(code);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                    className="rounded-xl bg-primary-50 border border-primary-200 px-3 py-3 text-primary-600 hover:bg-primary-100 transition"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <button onClick={close} className="btn-primary btn-primary-block">Done</button>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-5 space-y-4">
                {error && <div className="form-error">{error}</div>}
                <div>
                  <label className="field-label">Email</label>
                  <input
                    type="email"
                    className="field-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="employee@company.com"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={close} className="btn-ghost flex-1">Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 inline-flex items-center justify-center gap-2">
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                    Generate code
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
