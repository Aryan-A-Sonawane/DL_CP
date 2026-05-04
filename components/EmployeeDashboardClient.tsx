"use client";

import { useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ComposedChart, Bar, BarChart,
} from "recharts";
import {
  ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus,
  Info, X, Target, Shield, Brain, Activity, ChevronRight,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Suggestion {
  id: number;
  cycleStart: string;
  cycleEnd: string;
  suggestedRole: string;
  matchScore: number;
  failureScore: number;
  resilienceIndex: number;
  leadershipScore: number;
  growthTrajectory: string;
  explanation: string | null;
  featureImportance: string | null;
}

interface RecordPoint {
  cycle: string;
  hours: number;
  defects: number;
  tat: number;
  productivity: number; // hoursWorked / hoursPerCycle * 100
  errorRate: number;    // defects / hoursWorked * 100
}

interface Props {
  latest: Suggestion | null;
  history: Suggestion[];
  records: RecordPoint[];
  userName: string;
  deptName: string;
}

// ── Metric info tooltips ───────────────────────────────────────────────────────
const METRIC_INFO: Record<string, { formula: string; algorithm: string }> = {
  "Growth Score": {
    formula: "Growth Score = 100 − Failure Score",
    algorithm:
      "Failure Score is computed by the FailureLSTM model (2-layer bidirectional LSTM, hidden=64). It ingests a sequence of failure events — each encoded as (severity, category weight, recovery time, outcome, TAT, days ago). The trajectory head classifies direction; the failure head outputs a raw score → sigmoid → 0–100. Growth Score is the complement: higher means fewer/milder failures.",
  },
  Resilience: {
    formula: "Resilience = sigmoid(MLP output) × 100",
    algorithm:
      "ResilienceMLP is a 3-layer MLP (12 → 64 → 32 → 1) with BatchNorm + Dropout. Input features: hours efficiency, defect rate, avg TAT, on-time flag, soft-skill score, failure count, improvement rate, recovery speed, productivity cycles, and lifecycle. Output is passed through sigmoid to produce 0–100. JS heuristic baseline (recovery speed × outcome improvement × soft-skill buffer) is blended at 30%.",
  },
  Leadership: {
    formula: "Leadership = weighted_avg(strength scores) × recency_factor × failure_recovery_bonus",
    algorithm:
      "Pure JS heuristic (no DL model). Aggregates the employee's strength scores (problem-solving, communication, crisis management, empathy). Applies a recency decay to older failure events. Adds a bonus when the employee shows consistent outcome improvement after failures. Final score is clipped to 0–10.",
  },
  Trajectory: {
    formula: "Trajectory = argmax(softmax(trajectory_head output))",
    algorithm:
      "Trajectory is the second output head of FailureLSTM. After shared representation (mean-pool → Linear(128→64) → ReLU), a 3-way classifier (Linear(64→16→3)) produces logits for [ascending, stable, descending]. The class with the highest logit is the trajectory. Trained on 2100 synthetic records; 86.1% validation accuracy.",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function titleCase(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseFI(raw: string | null | undefined): Record<string, number> {
  try { return JSON.parse(raw ?? "{}"); } catch { return {}; }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
}

// Trend arrow comparing current vs previous value
function TrendArrow({ curr, prev, invert = false }: { curr: number; prev: number | null; invert?: boolean }) {
  if (prev === null) return <Minus size={14} className="text-surface-300" />;
  const delta = curr - prev;
  const up = invert ? delta < 0 : delta > 0;
  const same = Math.abs(delta) < 0.5;
  if (same) return <Minus size={14} className="text-surface-400" />;
  return up
    ? <TrendingUp  size={14} className="text-emerald-500" />
    : <TrendingDown size={14} className="text-red-500" />;
}

// ── Six-Sigma control chart (DPMO approach) ───────────────────────────────────
function buildSixSigmaData(records: RecordPoint[]) {
  if (records.length < 2) return [];
  const dpmos = records.map((r) => {
    // Opportunities = hoursWorked; defects = r.defects
    // DPMO = (defects / opportunities) * 1_000_000
    const dpmo = r.hours > 0 ? (r.defects / r.hours) * 1_000_000 : 0;
    return { cycle: r.cycle, dpmo, productivity: r.productivity, tat: r.tat };
  });
  const mean = dpmos.reduce((a, b) => a + b.dpmo, 0) / dpmos.length;
  const std = Math.sqrt(dpmos.reduce((a, b) => a + Math.pow(b.dpmo - mean, 2), 0) / dpmos.length);
  return dpmos.map((d) => ({ ...d, ucl: mean + 3 * std, lcl: Math.max(0, mean - 3 * std), mean }));
}

// ── Main component ────────────────────────────────────────────────────────────
export default function EmployeeDashboardClient({ latest, history, records, userName, deptName }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<string | null>(null);

  const prev = history.length >= 2 ? history[history.length - 2] : null;

  const chartData = history.map((h) => ({
    cycle: formatDate(h.cycleStart),
    resilience: +h.resilienceIndex.toFixed(1),
    leadership: +h.leadershipScore.toFixed(1),
    growth: +(100 - h.failureScore).toFixed(1),
  }));

  const sigmaData = buildSixSigmaData(records);

  const metricInfo = METRIC_INFO[tooltip ?? ""] ?? null;

  if (!latest) {
    return (
      <div className="card p-12 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 mb-3">
          <Activity size={20} className="text-primary-500" />
        </div>
        <p className="text-sm text-surface-500">
          No analysis yet — your department head needs to upload a cycle report first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Metric cards with info tooltip + trend arrow ─────────────────── */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {(
          [
            { key: "Growth Score",  value: Math.round(100 - latest.failureScore),    prev: prev ? Math.round(100 - prev.failureScore) : null,    icon: Target,   cc: "stat-card-emerald", ib: "bg-emerald-50",  ic: "text-emerald-500",  sub: "higher is better",  invert: false },
            { key: "Resilience",    value: +latest.resilienceIndex.toFixed(1),        prev: prev ? +prev.resilienceIndex.toFixed(1) : null,        icon: Shield,   cc: "stat-card-indigo",  ib: "bg-primary-50",  ic: "text-primary-500",  sub: undefined,          invert: false },
            { key: "Leadership",    value: +latest.leadershipScore.toFixed(1),        prev: prev ? +prev.leadershipScore.toFixed(1) : null,        icon: Brain,    cc: "stat-card-violet",  ib: "bg-violet-50",   ic: "text-violet-500",  sub: undefined,          invert: false },
            { key: "Trajectory",    value: titleCase(latest.growthTrajectory),        prev: null,                                                   icon: Activity, cc: "stat-card-amber",   ib: "bg-amber-50",    ic: "text-amber-500",  sub: undefined,          invert: false },
          ] as { key: string; value: number | string; prev: number | null; icon: React.ElementType; cc: string; ib: string; ic: string; sub?: string; invert: boolean }[]
        ).map(({ key, value, prev: pv, icon: Icon, cc, ib, ic, sub, invert }) => (
          <div key={key} className={`stat-card ${cc} relative`}>
            {/* Info button */}
            <button
              onClick={() => setTooltip(tooltip === key ? null : key)}
              className="absolute top-3 right-3 rounded-full p-1 text-surface-400 hover:text-primary-600 hover:bg-primary-50 transition"
              aria-label={`Info about ${key}`}
            >
              <Info size={14} />
            </button>
            <div className="flex items-start justify-between pr-6">
              <div>
                <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">{key}</p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-3xl font-extrabold text-surface-900">{value}</p>
                  {typeof pv === "number" && (
                    <TrendArrow curr={typeof value === "number" ? value : 0} prev={pv} />
                  )}
                </div>
                {sub && <p className="mt-1 text-xs text-surface-400">{sub}</p>}
              </div>
              <div className={`rounded-xl ${ib} p-3`}>
                <Icon size={20} className={ic} />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── Metric info drawer ───────────────────────────────────────────── */}
      {tooltip && metricInfo && (
        <div className="card p-6 border-l-4 border-primary-400 animate-slide-up">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-bold text-surface-900 mb-1">
                How <span className="text-primary-600">{tooltip}</span> is calculated
              </p>
              <p className="text-xs text-primary-700 font-mono bg-primary-50 rounded-lg px-3 py-1.5 mb-3 w-fit">
                {metricInfo.formula}
              </p>
              <p className="text-sm text-surface-600 leading-relaxed">{metricInfo.algorithm}</p>
            </div>
            <button onClick={() => setTooltip(null)} className="text-surface-400 hover:text-surface-600 shrink-0">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Report history accordion ─────────────────────────────────────── */}
      <section className="card p-7">
        <h3 className="text-lg font-bold text-surface-900 mb-4">Cycle Analysis Reports</h3>
        <div className="space-y-2">
          {[...history].reverse().map((s, idx) => {
            const fi = parseFI(s.featureImportance);
            const isOpen = expandedId === s.id;
            const isLatest = idx === 0;
            return (
              <div
                key={s.id}
                className={`rounded-2xl border transition-all ${isOpen ? "border-primary-200 shadow-sm" : "border-surface-100"}`}
              >
                {/* Row header */}
                <button
                  onClick={() => setExpandedId(isOpen ? null : s.id)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    {isLatest && <span className="badge badge-indigo text-xs">Latest</span>}
                    <span className="text-sm font-semibold text-surface-800">
                      {formatDate(s.cycleStart)} → {formatDate(s.cycleEnd)}
                    </span>
                    <span className="badge badge-violet">{s.suggestedRole}</span>
                    <span className={`badge ${
                      s.growthTrajectory === "ascending" ? "badge-emerald" :
                      s.growthTrajectory === "descending" ? "badge-red" : "badge-amber"
                    }`}>
                      {titleCase(s.growthTrajectory)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-surface-400 hidden sm:block">
                      Match {s.matchScore.toFixed(1)}% · Resilience {s.resilienceIndex.toFixed(1)}
                    </span>
                    {isOpen ? <ChevronUp size={16} className="text-primary-500" /> : <ChevronDown size={16} className="text-surface-400" />}
                  </div>
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div className="px-5 pb-5 space-y-5 border-t border-surface-100 pt-4">
                    {/* Mini stat row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Growth Score",    val: Math.round(100 - s.failureScore) },
                        { label: "Resilience",       val: s.resilienceIndex.toFixed(1) },
                        { label: "Leadership",       val: s.leadershipScore.toFixed(1) },
                        { label: "Match",            val: `${s.matchScore.toFixed(1)}%` },
                      ].map(({ label, val }) => (
                        <div key={label} className="rounded-xl bg-surface-50 px-4 py-3">
                          <p className="text-[10px] font-semibold uppercase text-surface-400 tracking-wider">{label}</p>
                          <p className="text-xl font-bold text-surface-900 mt-0.5">{val}</p>
                        </div>
                      ))}
                    </div>

                    {/* Explanation */}
                    {s.explanation && (
                      <div className="rounded-xl border border-primary-100 bg-primary-50/40 px-4 py-3">
                        <p className="text-xs text-primary-600 font-semibold mb-1">{s.suggestedRole}</p>
                        <p className="text-sm text-surface-600 leading-relaxed">{s.explanation}</p>
                      </div>
                    )}

                    {/* Feature importance */}
                    {Object.keys(fi).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Why this role</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Object.entries(fi).slice(0, 6).map(([k, v]) => (
                            <div key={k} className="flex items-center gap-2">
                              <span className="min-w-[130px] truncate text-xs text-surface-500">{k}</span>
                              <div className="h-1.5 flex-1 rounded-full bg-surface-100">
                                <div className="h-full rounded-full bg-gradient-to-r from-primary-400 to-violet-400" style={{ width: `${v}%` }} />
                              </div>
                              <span className="text-xs font-semibold text-primary-600 min-w-[30px] text-right">{v}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Progress charts — show as soon as there is ≥1 record ─────────── */}
      {chartData.length >= 1 && (
        <section className="card p-7 space-y-8">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <h3 className="text-lg font-bold text-surface-900">Progress Over Cycles</h3>
            {chartData.length === 1 && (
              <span className="text-xs text-surface-400 bg-surface-50 rounded-lg px-3 py-1.5">
                More cycles will appear here after future uploads
              </span>
            )}
          </div>

          {/* Resilience / Leadership / Growth */}
          <div>
            <p className="text-xs font-semibold uppercase text-surface-400 tracking-wider mb-3">
              Resilience · Leadership · Growth Score
            </p>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7f0" />
                  <XAxis dataKey="cycle" tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7f0" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="resilience" name="Resilience"   stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="leadership" name="Leadership"   stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="growth"     name="Growth Score" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Productivity over cycles */}
          {records.length >= 1 && (
            <div>
              <p className="text-xs font-semibold uppercase text-surface-400 tracking-wider mb-3">
                Productivity % (hours worked / capacity)
              </p>
              <div className="h-52">
                <ResponsiveContainer>
                  <BarChart data={records}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7f0" />
                    <XAxis dataKey="cycle" tick={{ fill: "#6b7280", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} domain={[0, 120]} unit="%" />
                    <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, "Productivity"]} contentStyle={{ borderRadius: 12 }} />
                    <Bar dataKey="productivity" name="Productivity %" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Error rate + TAT */}
          {records.length >= 1 && (
            <div>
              <p className="text-xs font-semibold uppercase text-surface-400 tracking-wider mb-3">
                Error Rate (defects / 100 h) · Avg TAT per defect (h)
              </p>
              <div className="h-56">
                <ResponsiveContainer>
                  <LineChart data={records}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7f0" />
                    <XAxis dataKey="cycle" tick={{ fill: "#6b7280", fontSize: 11 }} />
                    <YAxis yAxisId="left"  tick={{ fill: "#6b7280", fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: "#6b7280", fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line yAxisId="left"  type="monotone" dataKey="errorRate" name="Error Rate (per 100h)" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                    <Line yAxisId="right" type="monotone" dataKey="tat"       name="Avg TAT (h)"           stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Six Sigma control chart */}
          {sigmaData.length > 1 && (
            <div>
              <p className="text-xs font-semibold uppercase text-surface-400 tracking-wider mb-1">
                Six Sigma Control Chart — DPMO (Defects per Million Opportunities)
              </p>
              <p className="text-xs text-surface-400 mb-3">
                UCL / LCL = Mean ± 3σ. Points beyond UCL indicate an out-of-control process.
              </p>
              <div className="h-56">
                <ResponsiveContainer>
                  <ComposedChart data={sigmaData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7f0" />
                    <XAxis dataKey="cycle" tick={{ fill: "#6b7280", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <ReferenceLine y={sigmaData[0]?.ucl}  stroke="#ef4444" strokeDasharray="6 3" label={{ value: "UCL", fill: "#ef4444", fontSize: 11 }} />
                    <ReferenceLine y={sigmaData[0]?.mean} stroke="#6366f1" strokeDasharray="4 4" label={{ value: "Mean", fill: "#6366f1", fontSize: 11 }} />
                    <ReferenceLine y={sigmaData[0]?.lcl}  stroke="#10b981" strokeDasharray="6 3" label={{ value: "LCL", fill: "#10b981", fontSize: 11 }} />
                    <Line type="monotone" dataKey="dpmo" name="DPMO" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
