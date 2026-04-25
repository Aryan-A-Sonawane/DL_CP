"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

const CYCLE_DAYS: Record<string, number> = {
  monthly: 30,
  bimonthly: 60,
  quarterly: 91,
  yearly: 365,
};

export default function SettingsForm({
  deptId,
  name,
  cycleType,
  cycleLengthDays,
  cycleAnchor,
}: {
  deptId: number;
  name: string;
  cycleType: string;
  cycleLengthDays: number;
  cycleAnchor: string;
}) {
  const router = useRouter();
  const [type, setType] = useState(cycleType);
  const [days, setDays] = useState(cycleLengthDays);
  const [anchor, setAnchor] = useState(cycleAnchor);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function changeType(t: string) {
    setType(t);
    if (CYCLE_DAYS[t]) setDays(CYCLE_DAYS[t]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      const res = await fetch(`/api/dept/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycleType: type, cycleLengthDays: days, cycleAnchor: anchor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="form-error">{error}</div>}
      {success && <div className="form-success">Settings saved.</div>}
      <div>
        <label className="field-label">Department</label>
        <input className="field-input" value={name} disabled />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label">Cycle cadence</label>
          <select
            className="field-select"
            value={type}
            onChange={(e) => changeType(e.target.value)}
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
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          />
        </div>
      </div>
      <div>
        <label className="field-label">Cycle anchor (start date)</label>
        <input
          type="date"
          className="field-input"
          value={anchor}
          onChange={(e) => setAnchor(e.target.value)}
        />
        <p className="mt-1 text-xs text-surface-400">
          Cycles repeat back-to-back from this date. Reminders fire at T-10, 7, 5, 3, 2, 1, 0
          days before each cycle ends.
        </p>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="btn-primary inline-flex items-center gap-2"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Save settings
      </button>
    </form>
  );
}
