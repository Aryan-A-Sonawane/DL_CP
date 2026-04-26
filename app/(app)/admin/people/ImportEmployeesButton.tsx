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

/**
 * Inline header actions for the Admin → People page:
 *   - "Download template"  (ghost) — streams the blank import xlsx
 *   - "Import employees"   (primary) — opens a modal with the full flow
 *
 * The modal handles file selection, upload, results display, and
 * one-time credentials CSV download. Closing the modal refreshes the
 * underlying People list so newly-created users appear immediately.
 */
export default function ImportEmployeesButton({
  organizationName,
}: {
  organizationName: string;
}) {
  const router = useRouter();
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [open, setOpen] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  async function downloadTemplate() {
    setDownloadError(null);
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
      setDownloadError(e instanceof Error ? e.message : "Could not download template");
    } finally {
      setDownloadingTemplate(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={downloadTemplate}
          disabled={downloadingTemplate}
          className="btn-ghost inline-flex items-center gap-2"
          title="Download a blank employees.xlsx template"
        >
          {downloadingTemplate ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Download size={14} />
          )}
          Template
        </button>
        <button
          onClick={() => setOpen(true)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Upload size={14} />
          Import employees
        </button>
      </div>

      {downloadError && (
        <p className="text-xs text-red-600 mt-2 text-right">{downloadError}</p>
      )}

      {open && (
        <ImportModal
          organizationName={organizationName}
          onClose={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function ImportModal({
  organizationName,
  onClose,
}: {
  organizationName: string;
  onClose: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-surface-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="card max-w-3xl w-full p-7 my-8 animate-slide-up">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-surface-900">
              Import employees
            </h3>
            <p className="mt-0.5 text-sm text-surface-500">
              Importing into <strong>{organizationName}</strong>. Re-uploading is
              safe — existing users are updated in place.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-surface-400 hover:text-surface-700 p-1"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {!result && (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-dashed border-surface-300 bg-surface-50/40 p-6 text-center">
              <FileSpreadsheet
                size={32}
                className="mx-auto text-surface-400"
              />
              <p className="mt-2 text-sm text-surface-600 font-medium">
                {selectedFile ? selectedFile.name : "Drop your filled file here"}
              </p>
              <p className="text-xs text-surface-400 mt-0.5">
                Excel (.xlsx) only. Must follow the template format.
              </p>
              <div className="mt-4 inline-flex flex-wrap items-center gap-2 justify-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                  id="bulk-import-file-modal"
                />
                <label
                  htmlFor="bulk-import-file-modal"
                  className="btn-ghost inline-flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet size={14} />
                  {selectedFile ? "Change file" : "Choose file"}
                </label>
                {selectedFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-xs text-surface-500 hover:text-red-600 inline-flex items-center gap-1"
                  >
                    <X size={11} />
                    Remove
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-700 text-sm">
                    Import failed
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={onClose} className="btn-ghost flex-1">
                Cancel
              </button>
              <button
                onClick={uploadFile}
                disabled={!selectedFile || uploading}
                className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Upload size={14} />
                )}
                {uploading ? "Importing…" : "Import"}
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-5">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 size={18} />
              <p className="font-semibold">Import complete</p>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              <Stat label="Created" value={result.counts.created} tone="emerald" />
              <Stat label="Updated" value={result.counts.updated} tone="indigo" />
              <Stat label="Reactivated" value={result.counts.reactivated} tone="violet" />
              <Stat label="Skipped" value={result.counts.skipped} tone="amber" />
              <Stat label="Errors" value={result.counts.errored} tone="red" />
              <Stat label="Total" value={result.counts.total} tone="surface" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <SmallStat label="New depts" value={result.departments.created} />
              <SmallStat label="New projects" value={result.projects.created} />
              <SmallStat label="New assignments" value={result.assignments.created} />
              <SmallStat label="Strengths added" value={result.strengths.added} />
            </div>

            {result.credentials.length > 0 && (
              <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <KeyRound size={16} className="text-violet-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-surface-900 text-sm">
                        {result.credentials.length} initial passwords generated
                      </p>
                      <p className="text-xs text-surface-500 mt-0.5">
                        Download now — they&apos;re not stored in plaintext.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={downloadCredentialsCsv}
                    className="btn-primary inline-flex items-center gap-2 shrink-0 text-xs"
                  >
                    <Download size={12} />
                    Download CSV
                  </button>
                </div>
              </div>
            )}

            <details className="rounded-2xl border border-surface-200 bg-white">
              <summary className="cursor-pointer p-3 text-sm font-semibold text-surface-700 hover:bg-surface-50">
                Per-row outcomes ({result.rowOutcomes.length})
              </summary>
              <div className="table-container border-t border-surface-200 max-h-72 overflow-y-auto">
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

            <button onClick={onClose} className="btn-primary btn-primary-block">
              Done
            </button>
          </div>
        )}
      </div>
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
    <div className={`rounded-xl border p-2.5 ${toneMap[tone]}`}>
      <p className="text-[10px] uppercase tracking-wider font-semibold opacity-70">
        {label}
      </p>
      <p className="mt-0.5 text-xl font-bold">{value}</p>
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
