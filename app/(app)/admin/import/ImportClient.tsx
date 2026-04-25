"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  X,
} from "lucide-react";

interface RowOutcome {
  rowNumber: number;
  empCode: string;
  email: string;
  status: "created" | "updated" | "reactivated" | "skipped" | "error";
  message?: string;
}

interface CreatedCredential {
  empCode: string;
  name: string;
  email: string;
  department: string;
  role: "EMPLOYEE" | "DEPT_HEAD";
  password: string;
}

interface ImportResult {
  counts: {
    total: number;
    created: number;
    updated: number;
    reactivated: number;
    skipped: number;
    errored: number;
  };
  departments: { created: number; total: number };
  projects: { created: number };
  assignments: { created: number };
  strengths: { added: number };
  certifications: { added: number };
  rowOutcomes: RowOutcome[];
  credentials: CreatedCredential[];
}

export default function ImportClient({
  organizationName,
}: {
  organizationName: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function downloadTemplate() {
    setError(null);
    setDownloadingTemplate(true);
    try {
      const res = await fetch("/api/admin/employees/template");
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Could not download template");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "employees-import-template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not download template");
    } finally {
      setDownloadingTemplate(false);
    }
  }

  async function uploadFile() {
    if (!selectedFile) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      const res = await fetch("/api/admin/employees/bulk-import", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setResult(data as ImportResult);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setUploading(false);
    }
  }

  function downloadCredentialsCsv() {
    if (!result || result.credentials.length === 0) return;
    const header = ["Emp ID", "Name", "Email", "Department", "Role", "Initial Password"];
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [
      header.map(escape).join(","),
      ...result.credentials.map((c) =>
        [c.empCode, c.name, c.email, c.department, c.role, c.password]
          .map(escape)
          .join(","),
      ),
    ];
    const blob = new Blob([lines.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `initial-credentials-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <section className="card p-7">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <StepCard
            step={1}
            title="Download the template"
            body="A pre-formatted Excel with all expected columns and a quick reference sheet. Hand it to HR."
            action={
              <button
                onClick={downloadTemplate}
                disabled={downloadingTemplate}
                className="btn-ghost inline-flex items-center gap-2"
              >
                {downloadingTemplate ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                {downloadingTemplate ? "Generating…" : "Download template"}
              </button>
            }
          />
          <StepCard
            step={2}
            title="Upload the filled file"
            body="Excel (.xlsx) only. Re-uploading the same file is safe — existing users are updated, new ones get auto-generated passwords you can download afterwards."
            action={
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                  id="bulk-import-file"
                />
                <label
                  htmlFor="bulk-import-file"
                  className="btn-ghost inline-flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet size={14} />
                  {selectedFile ? "Change file" : "Choose file"}
                </label>
                {selectedFile && (
                  <span className="text-xs text-surface-600 inline-flex items-center gap-1.5">
                    <span className="font-mono">{selectedFile.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-surface-400 hover:text-red-600"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                <button
                  onClick={uploadFile}
                  disabled={!selectedFile || uploading}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {uploading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Upload size={14} />
                  )}
                  {uploading ? "Importing…" : "Import"}
                </button>
              </div>
            }
          />
        </div>
        <p className="mt-5 text-xs text-surface-400">
          Importing into <strong>{organizationName}</strong>. Cross-org email
          collisions and existing Admin / Super-Admin accounts are skipped
          automatically.
        </p>
      </section>

      {error && (
        <div className="card p-5 border-red-200 bg-red-50/40">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700">Import failed</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        </div>
      )}

      {result && (
        <section className="card p-7 space-y-6">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 size={18} />
            <h3 className="text-lg font-bold">Import complete</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Stat label="Created" value={result.counts.created} tone="emerald" />
            <Stat label="Updated" value={result.counts.updated} tone="indigo" />
            <Stat label="Reactivated" value={result.counts.reactivated} tone="violet" />
            <Stat label="Skipped" value={result.counts.skipped} tone="amber" />
            <Stat label="Errors" value={result.counts.errored} tone="red" />
            <Stat label="Total rows" value={result.counts.total} tone="surface" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <SmallStat label="New departments" value={result.departments.created} />
            <SmallStat label="New projects" value={result.projects.created} />
            <SmallStat label="New assignments" value={result.assignments.created} />
            <SmallStat label="Strengths added" value={result.strengths.added} />
          </div>

          {result.credentials.length > 0 && (
            <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <KeyRound size={18} className="text-violet-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-surface-900">
                      {result.credentials.length} initial passwords were generated
                    </p>
                    <p className="text-xs text-surface-500 mt-1">
                      We don&apos;t store these in plaintext — download them now
                      and hand them to your team. After this page reloads, the
                      passwords are gone.
                    </p>
                  </div>
                </div>
                <button
                  onClick={downloadCredentialsCsv}
                  className="btn-primary inline-flex items-center gap-2 shrink-0"
                >
                  <Download size={14} />
                  Download CSV
                </button>
              </div>
            </div>
          )}

          <details className="rounded-2xl border border-surface-200 bg-white">
            <summary className="cursor-pointer p-4 text-sm font-semibold text-surface-700 hover:bg-surface-50">
              Per-row outcomes ({result.rowOutcomes.length})
            </summary>
            <div className="table-container border-t border-surface-200">
              <table>
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Emp ID</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rowOutcomes.map((o) => (
                    <tr key={`${o.rowNumber}-${o.empCode}`}>
                      <td className="font-mono text-xs">{o.rowNumber}</td>
                      <td className="font-mono text-xs">{o.empCode || "—"}</td>
                      <td className="text-xs">{o.email || "—"}</td>
                      <td>
                        <span className={`badge ${statusBadge(o.status)}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="text-xs text-surface-500">
                        {o.message || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>
      )}
    </div>
  );
}

function StepCard({
  step,
  title,
  body,
  action,
}: {
  step: number;
  title: string;
  body: string;
  action: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold text-xs">
          {step}
        </span>
        <h4 className="font-semibold text-surface-900">{title}</h4>
      </div>
      <p className="mt-2 text-sm text-surface-500">{body}</p>
      <div className="mt-4">{action}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "indigo" | "violet" | "amber" | "red" | "surface";
}) {
  const toneMap = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    indigo: "border-primary-200 bg-primary-50 text-primary-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
    surface: "border-surface-200 bg-surface-50 text-surface-700",
  } as const;
  return (
    <div className={`rounded-xl border p-3 ${toneMap[tone]}`}>
      <p className="text-[10px] uppercase tracking-wider font-semibold opacity-70">
        {label}
      </p>
      <p className="mt-0.5 text-2xl font-bold">{value}</p>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-surface-50 border border-surface-200 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-surface-400 font-semibold">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-surface-900">{value}</p>
    </div>
  );
}

function statusBadge(status: RowOutcome["status"]): string {
  switch (status) {
    case "created":
      return "badge-emerald";
    case "updated":
      return "badge-indigo";
    case "reactivated":
      return "badge-violet";
    case "skipped":
      return "badge-amber";
    case "error":
      return "badge-red";
  }
}
