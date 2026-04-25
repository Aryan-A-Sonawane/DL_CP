"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Download, CheckCircle2 } from "lucide-react";

interface SeedSummary {
  department: { name: string; created: boolean };
  summary: {
    projects: { total: number; created: number };
    employees: {
      total: number;
      created: number;
      reactivated: number;
      alreadyExisted: number;
      skipped: { empCode: string; email: string; reason: string }[];
    };
    assignments: { created: number };
    strengths: { created: number };
  };
  passwordPattern: string;
}

export default function TestDataCard() {
  const router = useRouter();
  const [seeding, setSeeding] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<SeedSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function seed() {
    setError(null);
    setSeeding(true);
    try {
      const res = await fetch(
        "/api/admin/test-data/seed-software-engineering",
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Seeding failed");
      setResult(data as SeedSummary);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Seeding failed");
    } finally {
      setSeeding(false);
    }
  }

  async function downloadExcel() {
    setError(null);
    setDownloading(true);
    try {
      const res = await fetch("/api/admin/test-data/sample-excel");
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Download failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] ??
        "software-engineering-cycle.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section className="card p-7 border-2 border-dashed border-violet-200 bg-violet-50/30">
      <div className="flex items-start gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100">
          <Sparkles size={18} className="text-violet-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-surface-900">Demo / testing data</h3>
          <p className="mt-1 text-sm text-surface-500">
            Seed the <strong>Software Engineering</strong> department with 20
            sample employees (across 6 archetypes) plus 4 projects, then download
            a matching Excel file your dept head can upload to see the Failure
            Intelligence Mapper in action. Idempotent — safe to click twice.
          </p>
          <p className="mt-2 text-xs text-surface-400">
            Logins:{" "}
            <code className="font-mono text-violet-700">
              firstname@demo.local
            </code>{" "}
            · password{" "}
            <code className="font-mono text-violet-700">Firstname@12345</code>{" "}
            (e.g. <code>Aarav@12345</code>).
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={seed}
              disabled={seeding}
              className="btn-primary inline-flex items-center gap-2"
            >
              {seeding ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              {seeding ? "Seeding…" : "1. Seed 20 demo employees"}
            </button>
            <button
              onClick={downloadExcel}
              disabled={downloading}
              className="btn-ghost inline-flex items-center gap-2"
            >
              {downloading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              {downloading ? "Generating…" : "2. Download sample Excel"}
            </button>
          </div>

          {error && <div className="form-error mt-4">{error}</div>}

          {result && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                <CheckCircle2 size={16} />
                Seed complete
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <Stat
                  label="Department"
                  value={
                    result.department.created
                      ? "Created"
                      : "Already existed"
                  }
                />
                <Stat
                  label="Projects"
                  value={`${result.summary.projects.created} new / ${result.summary.projects.total} total`}
                />
                <Stat
                  label="Employees"
                  value={`${result.summary.employees.created} new${
                    result.summary.employees.reactivated
                      ? ` · ${result.summary.employees.reactivated} reactivated`
                      : ""
                  }${
                    result.summary.employees.alreadyExisted
                      ? ` · ${result.summary.employees.alreadyExisted} existed`
                      : ""
                  }`}
                />
                <Stat
                  label="Assignments"
                  value={`${result.summary.assignments.created} new`}
                />
              </div>
              {result.summary.employees.skipped.length > 0 && (
                <div className="text-xs text-amber-700 bg-amber-100 rounded-lg p-2.5">
                  <p className="font-semibold mb-1">
                    Skipped {result.summary.employees.skipped.length}:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {result.summary.employees.skipped.map((s) => (
                      <li key={s.empCode}>
                        {s.empCode} ({s.email}) — {s.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs text-surface-500">
                Next: hand the dept head login (or log in as a Dept Head you
                invited to Software Engineering) and upload the Excel file from
                button 2 above.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white border border-emerald-100 p-3">
      <p className="text-[10px] uppercase tracking-wider text-surface-400 font-semibold">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-surface-900">{value}</p>
    </div>
  );
}
