"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, FolderKanban, UserPlus, X } from "lucide-react";

interface Member {
  id: number;
  name: string;
  empCode: string | null;
  email: string;
}

interface Assignment {
  id: number;
  userId: number;
  userName: string;
  empCode: string | null;
}

interface Project {
  id: number;
  name: string;
  description: string | null;
  status: string;
  assignments: Assignment[];
}

export default function ProjectsClient({
  projects,
  members,
}: {
  projects: Project[];
  members: Member[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assigningTo, setAssigningTo] = useState<Project | null>(null);

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/dept/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create project");
      setName("");
      setDescription("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create project");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="card p-7">
        <h3 className="text-lg font-bold text-surface-900 mb-4">Create a project</h3>
        <form onSubmit={createProject} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {error && <div className="form-error md:col-span-3">{error}</div>}
          <div>
            <label className="field-label">Name</label>
            <input
              className="field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Apollo Migration"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="field-label">Description</label>
            <input
              className="field-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Q3 platform re-architecture"
            />
          </div>
          <button type="submit" disabled={creating} className="btn-primary inline-flex items-center gap-2 md:col-span-3 md:w-auto md:justify-self-start">
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add project
          </button>
        </form>
      </section>

      {projects.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 mb-3">
            <FolderKanban size={20} className="text-primary-500" />
          </div>
          <p className="text-sm text-surface-500">No projects yet — create one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map((p) => (
            <div key={p.id} className="card p-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-surface-900">{p.name}</h4>
                  {p.description && (
                    <p className="text-xs text-surface-500 mt-0.5">{p.description}</p>
                  )}
                </div>
                <span className="badge badge-emerald">{p.status}</span>
              </div>

              <div className="mt-4">
                <p className="text-xs uppercase font-semibold text-surface-400 tracking-wider mb-2">
                  Assigned ({p.assignments.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {p.assignments.length === 0 && (
                    <p className="text-xs text-surface-400">No one assigned yet.</p>
                  )}
                  {p.assignments.map((a) => (
                    <AssignmentChip
                      key={a.id}
                      assignment={a}
                      onRemoved={() => router.refresh()}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => setAssigningTo(p)}
                  className="btn-ghost inline-flex items-center gap-1.5 text-xs"
                >
                  <UserPlus size={12} />
                  Assign person
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {assigningTo && (
        <AssignModal
          project={assigningTo}
          members={members}
          onClose={() => {
            setAssigningTo(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function AssignmentChip({
  assignment,
  onRemoved,
}: {
  assignment: Assignment;
  onRemoved: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm(`Remove ${assignment.userName} from this project?`)) return;
    setBusy(true);
    try {
      await fetch(`/api/dept/assignments/${assignment.id}`, { method: "DELETE" });
      onRemoved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 border border-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700">
      {assignment.userName}
      {assignment.empCode && <span className="text-primary-400">·</span>}
      {assignment.empCode && <span className="text-primary-400">{assignment.empCode}</span>}
      <button onClick={remove} disabled={busy} className="ml-1 hover:text-red-600 transition">
        {busy ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />}
      </button>
    </span>
  );
}

function AssignModal({
  project,
  members,
  onClose,
}: {
  project: Project;
  members: Member[];
  onClose: () => void;
}) {
  const [userId, setUserId] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<{
    user: string;
    currentProjects: string[];
  } | null>(null);

  const alreadyAssigned = new Set(project.assignments.map((a) => a.userId));
  const candidates = members.filter((m) => !alreadyAssigned.has(m.id));

  async function submit(confirm = false) {
    if (!userId) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/dept/projects/${project.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, confirm }),
      });
      const data = await res.json();
      if (res.status === 409 && data.warning) {
        setWarning({ user: data.warning.user, currentProjects: data.warning.currentProjects });
        return;
      }
      if (!res.ok) throw new Error(data.error || "Assign failed");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assign failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/40 backdrop-blur-sm p-4">
      <div className="card max-w-md w-full p-7 animate-slide-up">
        <h3 className="text-lg font-bold text-surface-900">
          Assign to <span className="text-primary-600">{project.name}</span>
        </h3>

        {warning ? (
          <div className="mt-5 space-y-4">
            <div className="reminder-banner reminder-banner-warn">
              <div>
                <p className="font-semibold">Relocation warning</p>
                <p className="mt-1 text-xs">
                  <strong>{warning.user}</strong> is currently on:{" "}
                  {warning.currentProjects.join(", ")}. Assigning here will end those
                  assignments. Continue?
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setWarning(null);
                  setUserId("");
                }}
                className="btn-ghost flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => submit(true)}
                disabled={submitting}
                className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                Yes, relocate
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {error && <div className="form-error">{error}</div>}
            <div>
              <label className="field-label">Person</label>
              <select
                className="field-select"
                value={userId}
                onChange={(e) => setUserId(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Choose…</option>
                {candidates.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.empCode ? `· ${m.empCode}` : ""}
                  </option>
                ))}
              </select>
              {candidates.length === 0 && (
                <p className="mt-2 text-xs text-surface-400">
                  Everyone is already assigned to this project.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="btn-ghost flex-1">
                Cancel
              </button>
              <button
                onClick={() => submit(false)}
                disabled={submitting || !userId}
                className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                Assign
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
