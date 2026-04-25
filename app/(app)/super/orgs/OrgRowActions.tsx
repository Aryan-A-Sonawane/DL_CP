"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pause, Play, Pencil } from "lucide-react";

export default function OrgRowActions({
  orgId,
  active,
  name,
}: {
  orgId: number;
  active: boolean;
  name: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!confirm(`${active ? "Suspend" : "Re-activate"} "${name}"?`)) return;
    setBusy(true);
    try {
      await fetch(`/api/super/orgs/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function rename() {
    const next = prompt("New organization name:", name);
    if (!next || next.trim() === name) return;
    setBusy(true);
    try {
      await fetch(`/api/super/orgs/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: next.trim() }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={rename}
        disabled={busy}
        className="rounded-lg bg-surface-50 border border-surface-200 p-1.5 text-surface-500 hover:bg-surface-100 hover:text-surface-700 transition"
        title="Rename"
      >
        <Pencil size={13} />
      </button>
      <button
        onClick={toggle}
        disabled={busy}
        className={`rounded-lg border p-1.5 transition ${
          active
            ? "bg-red-50 border-red-100 text-red-600 hover:bg-red-100"
            : "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100"
        }`}
        title={active ? "Suspend" : "Re-activate"}
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : active ? <Pause size={13} /> : <Play size={13} />}
      </button>
    </div>
  );
}
