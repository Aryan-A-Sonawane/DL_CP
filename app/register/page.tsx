"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Building2, Eye, EyeOff } from "lucide-react";
import AuthShell from "@/components/AuthShell";

const ORG_TYPE_OPTIONS = [
  { value: "it_services", label: "IT Services / Outsourcing" },
  { value: "product",     label: "Product / SaaS" },
  { value: "consulting",  label: "Management / IT Consulting" },
  { value: "startup",     label: "Startup" },
  { value: "enterprise",  label: "Enterprise / Corporate" },
  { value: "other",       label: "Other" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    orgName:   "",
    orgType:   "other",
    industry:  "",
    size:      "",
    adminName: "",
    email:     "",
    password:  "",
  });
  const [showPw,    setShowPw]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      router.push(data.redirect || "/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Create your organization"
      subtitle="You'll become the org admin. You can invite department heads and employees afterwards."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-primary-600 font-semibold hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <div className="form-error">{error}</div>}

        <div>
          <label className="field-label">Organization name</label>
          <input
            id="reg-orgName"
            className="field-input"
            value={form.orgName}
            onChange={(e) => update("orgName", e.target.value)}
            placeholder="Acme Corp"
            required
          />
        </div>

        <div>
          <label className="field-label">Organization type</label>
          <select
            id="reg-orgType"
            className="field-select"
            value={form.orgType}
            onChange={(e) => update("orgType", e.target.value)}
          >
            {ORG_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-surface-400">
            Pre-configures the role catalog used for AI role suggestions. Fully editable later.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Industry</label>
            <input
              id="reg-industry"
              className="field-input"
              value={form.industry}
              onChange={(e) => update("industry", e.target.value)}
              placeholder="Software"
            />
          </div>
          <div>
            <label className="field-label">Team size</label>
            <select
              id="reg-size"
              className="field-select"
              value={form.size}
              onChange={(e) => update("size", e.target.value)}
            >
              <option value="">Select…</option>
              <option value="1-10">1–10</option>
              <option value="11-50">11–50</option>
              <option value="51-200">51–200</option>
              <option value="201-1000">201–1,000</option>
              <option value="1000+">1,000+</option>
            </select>
          </div>
        </div>

        <div>
          <label className="field-label">Your name</label>
          <input
            id="reg-adminName"
            className="field-input"
            value={form.adminName}
            onChange={(e) => update("adminName", e.target.value)}
            placeholder="Jane Admin"
            required
          />
        </div>
        <div>
          <label className="field-label">Work email</label>
          <input
            id="reg-email"
            className="field-input"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="you@company.com"
            required
          />
        </div>
        <div>
          <label className="field-label">Password</label>
          <div className="relative">
            <input
              id="reg-password"
              className="field-input field-input-icon"
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Min 8 characters"
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              tabIndex={-1}
              title={showPw ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary btn-primary-block inline-flex items-center gap-2"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Building2 size={14} />}
          {submitting ? "Creating…" : "Create organization"}
        </button>
      </form>
    </AuthShell>
  );
}
