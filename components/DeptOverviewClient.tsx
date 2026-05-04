"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  X, Brain, Target, MessageSquare, Zap,
  GitBranch, Sparkles, ChevronRight,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface AnalyzedEmployee {
  userId: number;
  name: string;
  empCode: string | null;
  suggestedRole: string;
  matchScore: number;
  resilienceIndex: number;
  growthTrajectory: string;
}

interface FeedbackRow {
  id: number;
  userName: string;
  empCode: string | null;
  suggestedRole: string;
  rating: string;
  reason: string | null;
  createdAt: string;
}

interface SkillRow {
  id: number;
  userName: string;
  empCode: string | null;
  skillName: string;
  learnedAt: string;
}

interface ProjectRow {
  id: number;
  name: string;
  memberCount: number;
}

interface CycleTrend {
  label: string;         // "Apr '25"
  avgHours: number;
  avgTAT: number;
  defects: number;
}

interface Props {
  analyzed:     AnalyzedEmployee[];
  feedbacks:    FeedbackRow[];
  skills:       SkillRow[];
  projects:     ProjectRow[];
  cycleTrends:  CycleTrend[];
}

type DrawerKey = "analyzed" | "feedbacks" | "skills" | "projects" | null;

const TRAJECTORY_BADGE: Record<string, string> = {
  ascending:  "badge-emerald",
  stable:     "badge-amber",
  descending: "badge-red",
};

const RATING_BADGE: Record<string, string> = {
  accepted:  "badge-emerald",
  rejected:  "badge-red",
  unsure:    "badge-amber",
};

function titleCase(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DeptOverviewClient({ analyzed, feedbacks, skills, projects, cycleTrends }: Props) {
  const [drawer, setDrawer] = useState<DrawerKey>(null);

  const hasTrends = cycleTrends.length > 1;

  return (
    <div className="space-y-8">
      {/* ── Clickable stat mini-cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ClickStat
          icon={Brain}
          label="Analyzed by model"
          value={analyzed.length}
          colorClass="stat-card-violet"
          iconBg="bg-violet-50"
          iconColor="text-violet-500"
          onClick={() => setDrawer(drawer === "analyzed" ? null : "analyzed")}
          active={drawer === "analyzed"}
        />
        <ClickStat
          icon={MessageSquare}
          label="Self-reviews submitted"
          value={feedbacks.length}
          colorClass="stat-card-emerald"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
          onClick={() => setDrawer(drawer === "feedbacks" ? null : "feedbacks")}
          active={drawer === "feedbacks"}
        />
        <ClickStat
          icon={Sparkles}
          label="New skills logged"
          value={skills.length}
          colorClass="stat-card-indigo"
          iconBg="bg-primary-50"
          iconColor="text-primary-500"
          onClick={() => setDrawer(drawer === "skills" ? null : "skills")}
          active={drawer === "skills"}
        />
        <ClickStat
          icon={GitBranch}
          label="Projects active"
          value={projects.length}
          colorClass="stat-card-amber"
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
          onClick={() => setDrawer(drawer === "projects" ? null : "projects")}
          active={drawer === "projects"}
        />
      </div>

      {/* ── Drawers ────────────────────────────────────────────────────────── */}
      {drawer === "analyzed" && (
        <Drawer title="Employees analyzed this cycle" onClose={() => setDrawer(null)}>
          {analyzed.length === 0 ? (
            <Empty msg="No employees analyzed yet. Upload a cycle report to trigger analysis." />
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Suggested Role</th>
                    <th>Match</th>
                    <th>Resilience</th>
                    <th>Trajectory</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {analyzed.map((a) => (
                    <tr key={a.userId}>
                      <td>
                        <p className="font-medium text-surface-800">{a.name}</p>
                        {a.empCode && <p className="text-xs text-surface-400 font-mono">#{a.empCode}</p>}
                      </td>
                      <td className="font-medium text-surface-700">{a.suggestedRole}</td>
                      <td><span className="badge badge-indigo">{a.matchScore.toFixed(1)}%</span></td>
                      <td>{a.resilienceIndex.toFixed(1)}</td>
                      <td>
                        <span className={`badge ${TRAJECTORY_BADGE[a.growthTrajectory] ?? "badge-amber"}`}>
                          {titleCase(a.growthTrajectory)}
                        </span>
                      </td>
                      <td>
                        <Link href={`/dept/people/${a.userId}`} className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium">
                          View <ChevronRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Drawer>
      )}

      {drawer === "feedbacks" && (
        <Drawer title="Employee self-reviews received" onClose={() => setDrawer(null)}>
          {feedbacks.length === 0 ? (
            <Empty msg="No self-reviews yet. Employees submit feedback from their Role Feedback page." />
          ) : (
            <div className="space-y-3">
              {feedbacks.map((f) => (
                <div key={f.id} className="rounded-xl border border-surface-100 bg-surface-50 p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-semibold text-surface-800">{f.userName}
                        {f.empCode && <span className="text-xs text-surface-400 font-mono ml-2">#{f.empCode}</span>}
                      </p>
                      <p className="text-xs text-surface-400 mt-0.5">On role: <span className="text-surface-600">{f.suggestedRole}</span></p>
                    </div>
                    <span className={`badge ${RATING_BADGE[f.rating] ?? "badge-amber"}`}>
                      {titleCase(f.rating)}
                    </span>
                  </div>
                  {f.reason && (
                    <p className="text-sm text-surface-600 mt-2 italic leading-relaxed">&ldquo;{f.reason}&rdquo;</p>
                  )}
                  <p className="text-xs text-surface-400 mt-2">
                    {new Date(f.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Drawer>
      )}

      {drawer === "skills" && (
        <Drawer title="New skills logged by your team" onClose={() => setDrawer(null)}>
          {skills.length === 0 ? (
            <Empty msg="No new skills logged yet. Employees add skills from their Profile page." />
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Employee</th><th>Skill</th><th>Logged</th></tr>
                </thead>
                <tbody>
                  {skills.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <p className="font-medium text-surface-800">{s.userName}</p>
                        {s.empCode && <p className="text-xs text-surface-400 font-mono">#{s.empCode}</p>}
                      </td>
                      <td><span className="badge badge-violet">{s.skillName}</span></td>
                      <td className="text-sm text-surface-500">
                        {new Date(s.learnedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Drawer>
      )}

      {drawer === "projects" && (
        <Drawer title="Active projects in your department" onClose={() => setDrawer(null)}>
          {projects.length === 0 ? (
            <Empty msg="No projects yet. Create one from the Projects tab." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  href="/dept/projects"
                  className="rounded-2xl border border-surface-100 bg-surface-50 hover:border-primary-200 transition p-4 block"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-primary-50 p-2.5">
                      <GitBranch size={15} className="text-primary-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-surface-800">{p.name}</p>
                      <p className="text-xs text-surface-400">{p.memberCount} {p.memberCount === 1 ? "member" : "members"}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Drawer>
      )}

      {/* ── Cycle trend charts ─────────────────────────────────────────────── */}
      {hasTrends && (
        <section className="card p-7 space-y-8">
          <h3 className="text-lg font-bold text-surface-900">Department Trends Over Cycles</h3>

          {/* Avg work hours */}
          <div>
            <p className="text-xs font-semibold uppercase text-surface-400 tracking-wider mb-3">
              Avg Work Hours per Employee
            </p>
            <div className="h-52">
              <ResponsiveContainer>
                <LineChart data={cycleTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7f0" />
                  <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7f0" }} />
                  <Line type="monotone" dataKey="avgHours" name="Avg Hours" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Avg TAT / defect */}
          <div>
            <p className="text-xs font-semibold uppercase text-surface-400 tracking-wider mb-3">
              Avg Turn-Around Time per Defect (h) · Avg Defects
            </p>
            <div className="h-52">
              <ResponsiveContainer>
                <LineChart data={cycleTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7f0" />
                  <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <YAxis yAxisId="left"  tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7f0" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line yAxisId="left"  type="monotone" dataKey="avgTAT"  name="Avg TAT (h)"  stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line yAxisId="right" type="monotone" dataKey="defects" name="Avg Defects"  stroke="#ef4444" strokeWidth={2}   dot={{ r: 3 }} strokeDasharray="5 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function ClickStat({
  icon: Icon, label, value, colorClass, iconBg, iconColor, onClick, active,
}: {
  icon: React.ElementType; label: string; value: number;
  colorClass: string; iconBg: string; iconColor: string;
  onClick: () => void; active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`stat-card ${colorClass} text-left w-full transition-all ${active ? "ring-2 ring-primary-400 shadow-lg" : "hover:shadow-md"}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-surface-900">{value}</p>
          <p className="mt-1 text-xs text-primary-500 font-medium">{active ? "Click to close ↑" : "Click to view →"}</p>
        </div>
        <div className={`rounded-xl ${iconBg} p-3`}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
    </button>
  );
}

function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="card p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-surface-900">{title}</h3>
        <button onClick={onClose} className="text-surface-400 hover:text-surface-700 transition rounded-lg p-1.5 hover:bg-surface-100">
          <X size={16} />
        </button>
      </div>
      {children}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Zap size={24} className="text-surface-300 mb-2" />
      <p className="text-sm text-surface-500">{msg}</p>
    </div>
  );
}
