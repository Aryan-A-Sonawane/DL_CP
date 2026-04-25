"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2 } from "lucide-react";

interface UploadResult {
  ok?: boolean;
  uploadId?: number;
  inserted?: number;
  matched?: number;
  unmatched?: { empCode: string; email: string; reason: string }[];
  errors?: { row: number; message: string }[];
  error?: string;
}

export default function UploadClient({
  cycleStart,
  cycleEnd,
}: {
  cycleStart: string;
  cycleEnd: string;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/dept/uploads", { method: "POST", body: fd });
      const data = (await res.json()) as UploadResult;
      setResult(data);
      if (res.ok) {
        setFile(null);
        router.refresh();
      }
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card p-7">
      <h3 className="text-lg font-bold text-surface-900 mb-1">
        Upload report for current cycle
      </h3>
      <p className="text-xs text-surface-400 mb-5">
        {new Date(cycleStart).toLocaleDateString()} →{" "}
        {new Date(cycleEnd).toLocaleDateString()}
      </p>

      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="field-label">Excel file (.xlsx)</span>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-surface-700 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
            required
          />
        </label>

        <button
          type="submit"
          disabled={!file || submitting}
          className="btn-primary inline-flex items-center gap-2"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {submitting ? "Processing…" : "Upload & analyze"}
        </button>
      </form>

      {result && (
        <div className="mt-6 space-y-3">
          {result.error && <div className="form-error">{result.error}</div>}
          {result.ok && (
            <div className="form-success">
              Inserted <strong>{result.inserted}</strong> performance{" "}
              {result.inserted === 1 ? "record" : "records"} ·{" "}
              {result.matched} matched to your department members.
            </div>
          )}
          {result.errors && result.errors.length > 0 && (
            <div className="card-soft p-4">
              <p className="text-sm font-semibold text-amber-700 mb-2">
                Row issues ({result.errors.length})
              </p>
              <ul className="text-xs text-surface-600 space-y-1 max-h-40 overflow-auto">
                {result.errors.map((e, i) => (
                  <li key={i}>
                    Row {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.unmatched && result.unmatched.length > 0 && (
            <div className="card-soft p-4">
              <p className="text-sm font-semibold text-amber-700 mb-2">
                Unmatched rows ({result.unmatched.length})
              </p>
              <p className="text-xs text-surface-500 mb-2">
                These employees were in the sheet but aren&apos;t in your department yet — invite
                them or update the sheet.
              </p>
              <ul className="text-xs text-surface-600 space-y-1 max-h-40 overflow-auto">
                {result.unmatched.map((u, i) => (
                  <li key={i}>
                    {u.empCode} · {u.email} — {u.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
