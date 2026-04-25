"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserMinus } from "lucide-react";

export default function PeopleRowActions({
  userId,
  userName,
  active,
}: {
  userId: number;
  userName: string;
  active: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!active) {
    return <span className="badge badge-red">Inactive</span>;
  }

  async function deactivate() {
    if (
      !confirm(
        `Mark ${userName} as left?\n\n• They will be removed from every active project.\n• Their account will be disabled (no login).\n• Historical data, defects, and feedback are preserved.\n\nAn admin can reactivate them later if needed.`,
      )
    )
      return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/deactivate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not deactivate");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not deactivate");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start">
      <button
        onClick={deactivate}
        disabled={busy}
        className="btn-ghost inline-flex items-center gap-1 text-xs text-red-600 hover:bg-red-50 px-2 py-1"
        title="Removes from all projects and disables login"
      >
        {busy ? (
          <Loader2 size={11} className="animate-spin" />
        ) : (
          <UserMinus size={11} />
        )}
        Mark as left
      </button>
      {err && <span className="text-xs text-red-600 mt-1">{err}</span>}
    </div>
  );
}
