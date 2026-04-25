"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, KeyRound } from "lucide-react";
import AuthShell from "@/components/AuthShell";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not join");
      router.push(data.redirect || "/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Join with an invite code"
      subtitle="Use the code from your invitation email to join your organization."
      footer={
        <>
          Already a member?{" "}
          <Link href="/login" className="text-primary-600 font-semibold hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <div className="form-error">{error}</div>}
        <div>
          <label className="field-label">Invitation code</label>
          <input
            className="field-input tracking-widest font-mono uppercase"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCDXXXX1234"
            required
          />
        </div>
        <div>
          <label className="field-label">Your name</label>
          <input
            className="field-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Employee"
            required
          />
        </div>
        <div>
          <label className="field-label">Choose a password</label>
          <input
            className="field-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            required
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary btn-primary-block inline-flex items-center gap-2"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
          {submitting ? "Joining…" : "Join organization"}
        </button>
      </form>
    </AuthShell>
  );
}
