"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Activity,
  Brain,
  Users,
  ArrowRight,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";
import { fetchDashboardStats, fetchEmployees } from "@/lib/api";
import KnowledgeGraph from "@/components/KnowledgeGraph";

interface Transition {
  from_domain: string;
  to_role: string;
  success_pct: number;
  count: number;
}

interface Stats {
  misalignment: { high: number; moderate: number; low: number; total_employees: number };
  top_transitions: Transition[];
  avg_resilience: number;
  avg_failure_score: number;
  avg_leadership: number;
  failure_category_distribution: Record<string, number>;
}

interface Employee {
  id: number;
  name: string;
  primary_domain: string;
  soft_skill_score: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDashboardStats(), fetchEmployees()])
      .then(([s, e]) => {
        setStats(s);
        setEmployees(e);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (!stats)
    return (
      <p className="text-surface-500 text-center py-20">Failed to load dashboard.</p>
    );

  return (
    <div className="animate-fade-in space-y-10">
      <section className="mesh-gradient rounded-3xl bg-white border border-surface-200 px-10 py-12 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 border border-primary-200 px-4 py-1.5 mb-5">
            <Sparkles size={14} className="text-primary-500" />
            <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
              Causal AI · Pattern Mining
            </span>
          </div>
          <h2 className="text-4xl font-extrabold text-surface-900 leading-tight tracking-tight">
            Turning setbacks into
            <span className="bg-gradient-to-r from-primary-500 to-violet-500 bg-clip-text text-transparent">
              {" "}career breakthroughs
            </span>
          </h2>
          <p className="mt-4 text-lg text-surface-500 leading-relaxed max-w-xl">
            Past failures are not dead ends — they&apos;re data. We mine patterns from growth experiences
            to align people with roles where they&apos;ll thrive, building resilient leaders along the way.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Activity}
          label="Resilience Index"
          value={stats.avg_resilience}
          sub="average across all people"
          colorClass="stat-card-indigo"
          iconBg="bg-primary-50"
          iconColor="text-primary-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Growth Potential"
          value={Math.round(100 - stats.avg_failure_score)}
          sub="higher is better"
          colorClass="stat-card-emerald"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
        />
        <StatCard
          icon={Users}
          label="People Analyzed"
          value={stats.misalignment.total_employees}
          sub="in the organization"
          colorClass="stat-card-violet"
          iconBg="bg-violet-50"
          iconColor="text-violet-500"
        />
        <StatCard
          icon={Brain}
          label="Leadership Score"
          value={stats.avg_leadership}
          sub="average out of 100"
          colorClass="stat-card-amber"
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
        />
      </section>

      <section className="card p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-surface-900">Growth Pathway Network</h3>
            <p className="text-sm text-surface-500 mt-1">
              Employees connected by shared growth patterns and role alignment pathways
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Target size={14} className="text-primary-400" />
            <span className="text-xs font-medium text-surface-400 uppercase tracking-wider">
              Interactive Graph
            </span>
          </div>
        </div>
        <KnowledgeGraph transitions={stats.top_transitions} employees={employees} />
      </section>

      <section>
        <h3 className="text-lg font-bold text-surface-900 mb-5">Top Suggested Role Transitions</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.top_transitions.map((t, i) => (
            <div
              key={i}
              className="card p-6 animate-slide-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-surface-700">{t.from_domain}</span>
                <ArrowRight size={14} className="text-primary-400" />
                <span className="text-sm font-semibold text-primary-600">{t.to_role}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 rounded-full bg-surface-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-400 to-violet-400 transition-all duration-500"
                    style={{ width: `${t.success_pct}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-primary-600">{t.success_pct}%</span>
              </div>
              <p className="mt-2 text-xs text-surface-400">
                {t.count} {t.count === 1 ? "person" : "people"} aligned
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-2xl border border-primary-100 bg-primary-50/50 px-6 py-4">
        <p className="text-xs text-primary-600/70 leading-relaxed">
          <strong>Ethical AI Notice:</strong> All recommendations are AI-generated and intended as
          supportive data points. No demographic information is used in analysis. Final decisions
          should involve the employee, manager, and HR team.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  colorClass,
  iconBg,
  iconColor,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  sub: string;
  colorClass: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className={`stat-card ${colorClass}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-surface-900">{value}</p>
          <p className="mt-1 text-xs text-surface-400">{sub}</p>
        </div>
        <div className={`rounded-xl ${iconBg} p-3`}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
    </div>
  );
}
