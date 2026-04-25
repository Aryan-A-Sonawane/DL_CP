"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ThumbsUp, ThumbsDown, HelpCircle, Send } from "lucide-react";

interface Item {
  id: number;
  suggestedRole: string;
  matchScore: number;
  createdAt: string;
  existingFeedback: {
    decision: string;
    desiredRole: string | null;
    reason: string | null;
  } | null;
}

type Decision = "accepted" | "rejected" | "unsure";

export default function FeedbackClient({ items }: { items: Item[] }) {
  return (
    <div className="space-y-5">
      {items.map((s) => (
        <Card key={s.id} item={s} />
      ))}
    </div>
  );
}

function Card({ item }: { item: Item }) {
  const router = useRouter();
  const initial = (item.existingFeedback?.decision as Decision) ?? "unsure";
  const [decision, setDecision] = useState<Decision>(initial);
  const [desiredRole, setDesiredRole] = useState(item.existingFeedback?.desiredRole ?? "");
  const [reason, setReason] = useState(item.existingFeedback?.reason ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(item.existingFeedback ? "saved" : null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/employee/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggestionId: item.id,
          decision,
          desiredRole: desiredRole || null,
          reason: reason || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save feedback");
      setSavedAt("just now");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save feedback");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-surface-400 uppercase tracking-wider font-semibold">
            Suggested · {item.createdAt}
          </p>
          <h3 className="text-lg font-bold text-surface-900 mt-0.5">{item.suggestedRole}</h3>
        </div>
        <span className="badge badge-indigo">{item.matchScore.toFixed(1)}% match</span>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div>
          <p className="field-label">Does this resonate with you?</p>
          <div className="flex flex-wrap gap-2">
            <DecisionPill icon={ThumbsUp} label="Yes, this fits" value="accepted" current={decision} onChange={setDecision} tone="emerald" />
            <DecisionPill icon={HelpCircle} label="Not sure" value="unsure" current={decision} onChange={setDecision} tone="amber" />
            <DecisionPill icon={ThumbsDown} label="No, doesn't fit" value="rejected" current={decision} onChange={setDecision} tone="red" />
          </div>
        </div>

        {decision !== "accepted" && (
          <div>
            <label className="field-label">Which role would you actually want?</label>
            <input
              className="field-input"
              value={desiredRole}
              onChange={(e) => setDesiredRole(e.target.value)}
              placeholder="e.g., Engineering Manager, Product Strategist…"
            />
          </div>
        )}

        <div>
          <label className="field-label">
            {decision === "accepted"
              ? "Why does this role click?"
              : "Why? What would make a better recommendation?"}
          </label>
          <textarea
            className="field-textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Your honest answer trains the model."
          />
        </div>

        {error && <div className="form-error">{error}</div>}
        <div className="flex items-center justify-between gap-3">
          <button type="submit" disabled={submitting} className="btn-primary inline-flex items-center gap-2">
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {item.existingFeedback ? "Update feedback" : "Submit feedback"}
          </button>
          {savedAt && <span className="text-xs text-emerald-600">Saved {savedAt}</span>}
        </div>
      </form>
    </div>
  );
}

function DecisionPill({
  icon: Icon,
  label,
  value,
  current,
  onChange,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: Decision;
  current: Decision;
  onChange: (v: Decision) => void;
  tone: "emerald" | "amber" | "red";
}) {
  const active = current === value;
  const toneCls =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-red-200 bg-red-50 text-red-700";
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
        active
          ? `${toneCls} ring-2 ring-offset-2 ring-${tone}-300`
          : "border-surface-200 bg-white text-surface-600 hover:border-surface-300"
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}
