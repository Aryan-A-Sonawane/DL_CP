"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserMinus, UserCheck, ShieldOff } from "lucide-react";

export interface PersonRow {
  id: number;
  name: string;
  email: string;
  role: "DEPT_HEAD" | "EMPLOYEE";
  departmentId: number | null;
  departmentName: string | null;
  profileComplete: boolean;
  active: boolean;
  createdAt: string;
}

export default function PeopleClient({ initial }: { initial: PersonRow[] }) {
  const [filter, setFilter] = useState<"active" | "inactive" | "all">("active");
  const [roleFilter, setRoleFilter] = useState<"all" | "DEPT_HEAD" | "EMPLOYEE">("all");

  const visible = initial.filter((p) => {
    if (filter === "active" && !p.active) return false;
    if (filter === "inactive" && p.active) return false;
    if (roleFilter !== "all" && p.role !== roleFilter) return false;
    return true;
  });

  const counts = {
    active: initial.filter((p) => p.active).length,
    inactive: initial.filter((p) => !p.active).length,
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="inline-flex rounded-xl border border-surface-200 bg-white p-1">
          {(["active", "inactive", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition ${
                filter === f
                  ? "bg-primary-500 text-white"
                  : "text-surface-500 hover:text-surface-900"
              }`}
            >
              {f}
              {f === "active" && (
                <span className="ml-1.5 text-[10px] opacity-75">{counts.active}</span>
              )}
              {f === "inactive" && (
                <span className="ml-1.5 text-[10px] opacity-75">{counts.inactive}</span>
              )}
            </button>
          ))}
        </div>
        <select
          className="field-select max-w-[180px]"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
        >
          <option value="all">All roles</option>
          <option value="DEPT_HEAD">Department Heads</option>
          <option value="EMPLOYEE">Employees</option>
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Profile</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-surface-400 py-8">
                  No one matches the current filters.
                </td>
              </tr>
            ) : (
              visible.map((p) => <Row key={p.id} person={p} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ person }: { person: PersonRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "deact" | "react" | "demote">(null);
  const [err, setErr] = useState<string | null>(null);

  async function deactivate() {
    if (
      !confirm(
        `Deactivate ${person.name}? They will be removed from all active projects and won't be able to log in. You can reactivate them later.`,
      )
    )
      return;
    setBusy("deact");
    setErr(null);
    try {
      const res = await fetch(`/api/admin/users/${person.id}/deactivate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not deactivate");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not deactivate");
    } finally {
      setBusy(null);
    }
  }

  async function reactivate() {
    setBusy("react");
    setErr(null);
    try {
      const res = await fetch(`/api/admin/users/${person.id}/reactivate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not reactivate");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not reactivate");
    } finally {
      setBusy(null);
    }
  }

  async function demote() {
    if (person.role !== "DEPT_HEAD" || !person.departmentId) return;
    if (
      !confirm(
        `Remove ${person.name} as head of ${person.departmentName}? They will be demoted to Employee but stay in the department.`,
      )
    )
      return;
    setBusy("demote");
    setErr(null);
    try {
      const res = await fetch(
        `/api/admin/departments/${person.departmentId}/head`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not remove from head");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not remove from head");
    } finally {
      setBusy(null);
    }
  }

  return (
    <tr className={person.active ? "" : "opacity-60"}>
      <td className="font-semibold text-surface-900">{person.name}</td>
      <td>{person.email}</td>
      <td>
        <span
          className={`badge ${
            person.role === "DEPT_HEAD" ? "badge-violet" : "badge-indigo"
          }`}
        >
          {person.role}
        </span>
      </td>
      <td>{person.departmentName ?? "—"}</td>
      <td>
        <span
          className={`badge ${
            person.profileComplete ? "badge-emerald" : "badge-amber"
          }`}
        >
          {person.profileComplete ? "Complete" : "Incomplete"}
        </span>
      </td>
      <td>
        <span className={`badge ${person.active ? "badge-emerald" : "badge-red"}`}>
          {person.active ? "Active" : "Inactive"}
        </span>
      </td>
      <td>
        <div className="flex flex-wrap gap-1.5">
          {person.role === "DEPT_HEAD" && person.active && (
            <button
              onClick={demote}
              disabled={busy !== null}
              className="btn-ghost inline-flex items-center gap-1 text-xs text-violet-600 hover:bg-violet-50 px-2 py-1"
              title="Remove as Department Head (keeps them as Employee)"
            >
              {busy === "demote" ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <ShieldOff size={11} />
              )}
              Remove as head
            </button>
          )}
          {person.active ? (
            <button
              onClick={deactivate}
              disabled={busy !== null}
              className="btn-ghost inline-flex items-center gap-1 text-xs text-red-600 hover:bg-red-50 px-2 py-1"
              title="Mark as left / employment cancelled"
            >
              {busy === "deact" ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <UserMinus size={11} />
              )}
              Deactivate
            </button>
          ) : (
            <button
              onClick={reactivate}
              disabled={busy !== null}
              className="btn-ghost inline-flex items-center gap-1 text-xs text-emerald-600 hover:bg-emerald-50 px-2 py-1"
            >
              {busy === "react" ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <UserCheck size={11} />
              )}
              Reactivate
            </button>
          )}
        </div>
        {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
      </td>
    </tr>
  );
}
