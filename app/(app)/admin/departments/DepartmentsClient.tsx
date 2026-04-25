"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, UserPlus, Copy, Check, UserMinus } from "lucide-react";

interface Dept {
  id: number;
  name: string;
  cycleType: string;
  cycleLengthDays: number;
  head: { id: number; name: string; email: string } | null;
  memberCount: number;
  projectCount: number;
}

const CYCLE_DAYS: Record<string, number> = {
  monthly: 30,
  bimonthly: 60,
  quarterly: 91,
  yearly: 365,
};

export default function DepartmentsClient({ initial }: { initial: Dept[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [cycleType, setCycleType] = useState("monthly");
  const [cycleLengthDays, setCycleLengthDays] = useState(30);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteFor, setInviteFor] = useState<{ deptId: number; deptName: string } | null>(null);

  function setCycle(type: string) {
    setCycleType(type);
    if (CYCLE_DAYS[type]) setCycleLengthDays(CYCLE_DAYS[type]);
  }

  async function createDept(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, cycleType, cycleLengthDays }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create department");
      setName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create department");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="card p-7">
        <h3 className="text-lg font-bold text-surface-900 mb-4">Create a department</h3>
        <form onSubmit={createDept} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {error && <div className="form-error md:col-span-4">{error}</div>}
          <div className="md:col-span-2">
            <label className="field-label">Name</label>
            <input
              className="field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Engineering"
              required
            />
          </div>
          <div>
            <label className="field-label">Cycle type</label>
            <select
              className="field-select"
              value={cycleType}
              onChange={(e) => setCycle(e.target.value)}
            >
              <option value="monthly">Monthly</option>
              <option value="bimonthly">Bimonthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label className="field-label">Cycle length (days)</label>
            <input
              type="number"
              min={7}
              max={400}
              className="field-input"
              value={cycleLengthDays}
              onChange={(e) => setCycleLengthDays(Number(e.target.value))}
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="btn-primary inline-flex items-center gap-2 md:col-span-4 md:w-auto md:justify-self-start"
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {creating ? "Creating…" : "Add department"}
          </button>
        </form>
      </section>

      {initial.length > 0 && (
        <section className="card p-7">
          <h3 className="text-lg font-bold text-surface-900 mb-4">Existing departments</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {initial.map((d) => (
              <div key={d.id} className="card-soft p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-surface-900">{d.name}</h4>
                    <p className="text-xs text-surface-400 mt-0.5">
                      {d.cycleType} · {d.cycleLengthDays}d
                    </p>
                  </div>
                  <span className="badge badge-indigo">{d.memberCount} members</span>
                </div>
                <div className="mt-3 text-sm">
                  {d.head ? (
                    <p className="text-surface-700">
                      Head: <strong>{d.head.name}</strong>
                      <br />
                      <span className="text-xs text-surface-400">{d.head.email}</span>
                    </p>
                  ) : (
                    <p className="text-amber-600 text-xs">No head assigned</p>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setInviteFor({ deptId: d.id, deptName: d.name })}
                    className="btn-ghost inline-flex items-center gap-1.5 text-xs"
                  >
                    <UserPlus size={12} />
                    Invite to {d.name}
                  </button>
                  {d.head && (
                    <RemoveHeadButton
                      deptId={d.id}
                      deptName={d.name}
                      headName={d.head.name}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {inviteFor && (
        <InviteModal
          deptId={inviteFor.deptId}
          deptName={inviteFor.deptName}
          onClose={() => {
            setInviteFor(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function RemoveHeadButton({
  deptId,
  deptName,
  headName,
}: {
  deptId: number;
  deptName: string;
  headName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function remove() {
    if (
      !confirm(
        `Remove ${headName} as head of ${deptName}? They will be demoted to Employee but stay in the department with all their data intact.`,
      )
    )
      return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/departments/${deptId}/head`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not remove head");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not remove head");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex flex-col">
      <button
        onClick={remove}
        disabled={busy}
        className="btn-ghost inline-flex items-center gap-1.5 text-xs text-red-600 hover:bg-red-50"
      >
        {busy ? <Loader2 size={12} className="animate-spin" /> : <UserMinus size={12} />}
        Remove head
      </button>
      {err && <span className="text-xs text-red-600 mt-1">{err}</span>}
    </div>
  );
}

function InviteModal({
  deptId,
  deptName,
  onClose,
}: {
  deptId: number;
  deptName: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"DEPT_HEAD" | "EMPLOYEE">("EMPLOYEE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<"sent" | "skipped" | "failed" | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, departmentId: deptId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invite failed");
      setCode(data.code);
      setEmailStatus(data.emailStatus ?? "skipped");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setSubmitting(false);
    }
  }

  function copy() {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/40 backdrop-blur-sm p-4">
      <div className="card max-w-md w-full p-7 animate-slide-up">
        <h3 className="text-lg font-bold text-surface-900">
          Invite to <span className="text-primary-600">{deptName}</span>
        </h3>
        {code ? (
          <div className="mt-5 space-y-4">
            <div className="form-success">
              {emailStatus === "sent"
                ? `Invitation emailed to ${email}. They can also use the code below — it expires in 14 days.`
                : emailStatus === "failed"
                  ? "Invitation created, but the email failed to send. Share the code manually below."
                  : "Invitation created. SMTP isn't configured yet — share this code manually. It expires in 14 days."}
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-xl bg-surface-50 border border-surface-200 px-4 py-3 font-mono text-lg tracking-widest text-surface-900 text-center">
                {code}
              </code>
              <button
                onClick={copy}
                className="rounded-xl bg-primary-50 border border-primary-200 px-3 py-3 text-primary-600 hover:bg-primary-100 transition"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <p className="text-xs text-surface-400">
              They can redeem it at <code>/join</code>.
            </p>
            <button onClick={onClose} className="btn-primary btn-primary-block">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-4">
            {error && <div className="form-error">{error}</div>}
            <div>
              <label className="field-label">Invitee email</label>
              <input
                type="email"
                className="field-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="head@company.com"
                required
              />
            </div>
            <div>
              <label className="field-label">Role</label>
              <select
                className="field-select"
                value={role}
                onChange={(e) => setRole(e.target.value as "DEPT_HEAD" | "EMPLOYEE")}
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="DEPT_HEAD">Department Head</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary flex-1 inline-flex items-center justify-center gap-2">
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                Generate code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
