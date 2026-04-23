"use client";

import { useEffect, useState } from "react";
import { Search, Star, TrendingUp, Briefcase, Clock } from "lucide-react";
import { fetchEmployees } from "@/lib/api";

interface Employee {
  id: number;
  emp_code: string;
  name: string;
  primary_domain: string;
  department: string;
  years_experience: number;
  soft_skill_score: number;
  repeated_failure_area: string;
  top_strengths: string[];
}

export default function Masters() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      fetchEmployees(search)
        .then(setEmployees)
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">People</h2>
          <p className="mt-1 text-sm text-surface-500">
            Explore growth patterns, strengths, and resilience across the team
          </p>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-search"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : employees.length === 0 ? (
        <div className="card flex items-center justify-center p-12 text-surface-400">
          No employees found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((emp, idx) => (
            <PersonCard key={emp.id} emp={emp} delay={idx * 50} />
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-primary-100 bg-primary-50/50 px-6 py-3">
        <p className="text-xs text-primary-600/70">
          All employee data is processed locally. No demographic attributes are used in
          AI analysis. Data access is audit-logged per PRUTL compliance.
        </p>
      </div>
    </div>
  );
}

function PersonCard({ emp, delay }: { emp: Employee; delay: number }) {
  return (
    <div className="card p-6 animate-slide-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start gap-4 mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-violet-100 text-sm font-bold text-primary-600 shrink-0">
          {emp.name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-surface-900 truncate">{emp.name}</h3>
          <p className="text-xs text-surface-400 mt-0.5">{emp.emp_code}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Briefcase size={14} className="text-surface-400 shrink-0" />
          <span className="text-surface-700">{emp.primary_domain}</span>
          <span className="text-surface-300">·</span>
          <span className="text-surface-500 text-xs">{emp.department}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Clock size={14} className="text-surface-400 shrink-0" />
          <span className="text-surface-600">{emp.years_experience} years experience</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <TrendingUp size={14} className="text-amber-500 shrink-0" />
          <span className="text-amber-700 font-medium text-xs">
            Growth area: {emp.repeated_failure_area}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-1">
          {emp.top_strengths.map((s, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-primary-50 border border-primary-100 px-2.5 py-1 text-[11px] font-medium text-primary-600"
            >
              <Star size={9} className="text-primary-400" />
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-surface-100">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-surface-500">Soft Skills</span>
          <span className="text-xs font-bold text-surface-700">{emp.soft_skill_score}/10</span>
        </div>
        <div className="h-2 w-full rounded-full bg-surface-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              emp.soft_skill_score >= 8
                ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                : emp.soft_skill_score >= 6
                ? "bg-gradient-to-r from-amber-400 to-amber-500"
                : "bg-gradient-to-r from-red-400 to-red-500"
            }`}
            style={{ width: `${(emp.soft_skill_score / 10) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
