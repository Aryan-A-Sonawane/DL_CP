import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, Activity, Upload } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/db";
import { getDeptCycleStatus } from "@/lib/reminders";
import ReminderBanner from "@/components/ReminderBanner";
import DeptOverviewClient from "@/components/DeptOverviewClient";

export const dynamic = "force-dynamic";

export default async function DeptOverview() {
  const user = await getCurrentUser();
  if (!user || user.role !== "DEPT_HEAD") redirect("/dashboard");
  if (!user.departmentId) return <NoDeptYet />;

  const dept = await withRetry(() => prisma.department.findUnique({
    where: { id: user.departmentId! },
    include: { _count: { select: { members: true, projects: true, uploads: true } } },
  }));
  if (!dept) redirect("/dashboard");

  const status = await getDeptCycleStatus(dept.id);

  // ── Current-cycle records ─────────────────────────────────────────────────
  const cycleRecords = await withRetry(() => prisma.performanceRecord.findMany({
    where: {
      user: { departmentId: dept!.id },
      cycleStart: status.cycle.start,
      cycleEnd:   status.cycle.end,
    },
    include: { user: { select: { name: true, empCode: true } } },
  }));

  const totalMembers = dept._count.members;
  const avgHoursWorked = cycleRecords.length > 0
    ? cycleRecords.reduce((a, b) => a + b.hoursWorked, 0) / cycleRecords.length
    : 0;
  const avgTAT = cycleRecords.length > 0
    ? cycleRecords.reduce((a, b) => a + b.avgTurnAroundHours, 0) / cycleRecords.length
    : 0;

  // ── Data for clickable cards ──────────────────────────────────────────────
  // 1. Analyzed employees (latest suggestion per user this cycle)
  const suggestions = await withRetry(() => prisma.roleSuggestion.findMany({
    where: {
      user: { departmentId: dept!.id },
      cycleStart: status.cycle.start,
    },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, empCode: true } } },
    distinct: ["userId"],
  }));

  const analyzed = suggestions.map((s) => ({
    userId:           s.userId,
    name:             s.user.name,
    empCode:          s.user.empCode,
    suggestedRole:    s.suggestedRole,
    matchScore:       s.matchScore,
    resilienceIndex:  s.resilienceIndex,
    growthTrajectory: s.growthTrajectory,
  }));

  // 2. Feedbacks received
  const rawFeedbacks = await withRetry(() => prisma.roleFeedback.findMany({
    where: { user: { departmentId: dept!.id } },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      user:       { select: { name: true, empCode: true } },
      suggestion: { select: { suggestedRole: true } },
    },
  }));
  const feedbacks = rawFeedbacks.map((f) => ({
    id:           f.id,
    userName:     f.user.name,
    empCode:      f.user.empCode,
    suggestedRole: f.suggestion.suggestedRole,
    rating:       f.decision,
    reason:       f.reason ?? null,
    createdAt:    f.createdAt.toISOString(),
  }));

  // 3. New skills
  const rawSkills = await withRetry(() => prisma.newSkill.findMany({
    where: { user: { departmentId: dept!.id } },
    orderBy: { learnedAt: "desc" },
    take: 30,
    include: { user: { select: { name: true, empCode: true } } },
  }));
  const skills = rawSkills.map((s) => ({
    id:       s.id,
    userName: s.user.name,
    empCode:  s.user.empCode,
    skillName: s.name,
    learnedAt: s.learnedAt.toISOString(),
  }));

  // 4. Projects
  const rawProjects = await withRetry(() => prisma.project.findMany({
    where: { departmentId: dept!.id },
    include: { _count: { select: { assignments: true } } },
    orderBy: { createdAt: "desc" },
  }));
  const projects = rawProjects.map((p) => ({
    id:          p.id,
    name:        p.name,
    memberCount: p._count.assignments,
  }));

  // ── Cycle trend data (last 6 upload cycles) ───────────────────────────────
  const allUploads = await withRetry(() => prisma.excelUpload.findMany({
    where: { departmentId: dept!.id },
    orderBy: { createdAt: "asc" },
    take: 6,
    select: { cycleStart: true, cycleEnd: true, createdAt: true },
  }));

  const cycleTrends = await Promise.all(
    allUploads.map(async (u) => {
      const recs = await withRetry(() => prisma.performanceRecord.findMany({
        where: { user: { departmentId: dept!.id }, cycleStart: u.cycleStart, cycleEnd: u.cycleEnd },
      }));
      const n = recs.length || 1;
      return {
        label:    u.cycleStart.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        avgHours: Math.round(recs.reduce((a, b) => a + b.hoursWorked, 0) / n * 10) / 10,
        avgTAT:   Math.round(recs.reduce((a, b) => a + b.avgTurnAroundHours, 0) / n * 100) / 100,
        defects:  Math.round(recs.reduce((a, b) => a + b.defects, 0) / n * 10) / 10,
      };
    })
  );

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">{dept.name}</h2>
          <p className="mt-1 text-sm text-surface-500">
            Cycle {status.cycle.start.toLocaleDateString()} → {status.cycle.end.toLocaleDateString()} · {dept.cycleType}
          </p>
        </div>
        <Link href="/dept/uploads" className="btn-primary inline-flex items-center gap-2">
          <Upload size={14} />
          Upload cycle report
        </Link>
      </div>

      <ReminderBanner
        daysToGo={status.cycle.daysToGo}
        cycleEnd={status.cycle.end}
        uploadedThisCycle={status.uploadedThisCycle}
      />

      {/* Always-visible summary stats (non-clickable) */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="stat-card stat-card-indigo">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">People in department</p>
              <p className="mt-2 text-3xl font-extrabold text-surface-900">{totalMembers}</p>
            </div>
            <div className="rounded-xl bg-primary-50 p-3"><Users size={20} className="text-primary-500" /></div>
          </div>
        </div>
        <div className="stat-card stat-card-amber">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Avg work hours this cycle</p>
              <p className="mt-2 text-3xl font-extrabold text-surface-900">{avgHoursWorked.toFixed(1)}</p>
              <p className="mt-1 text-xs text-surface-400">Avg TAT: {avgTAT.toFixed(2)} h/defect</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3"><Activity size={20} className="text-amber-500" /></div>
          </div>
        </div>
      </section>

      {/* Client section: clickable cards + drawers + charts */}
      <DeptOverviewClient
        analyzed={analyzed}
        feedbacks={feedbacks}
        skills={skills}
        projects={projects}
        cycleTrends={cycleTrends}
      />

      {/* Quick actions */}
      <section className="card p-8">
        <h3 className="text-lg font-bold text-surface-900 mb-4">Quick actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickLink href="/dept/people"   title="Manage people"  desc="View members, invite employees." />
          <QuickLink href="/dept/projects" title="Projects"       desc="Create projects and assign people." />
          <QuickLink href="/dept/settings" title="Cycle settings" desc="Change cadence, anchor and reminders." />
        </div>
      </section>
    </div>
  );
}

function NoDeptYet() {
  return (
    <div className="animate-fade-in space-y-6">
      <h2 className="text-2xl font-bold text-surface-900">No department assigned yet</h2>
      <div className="card p-8">
        <p className="text-sm text-surface-600">
          Your org admin needs to assign you as the head of a department before you can manage projects,
          upload cycle reports or view dept analytics.
        </p>
      </div>
    </div>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="card-soft p-5 no-underline block hover:border-primary-200 transition">
      <h4 className="font-semibold text-surface-900">{title}</h4>
      <p className="mt-1 text-xs text-surface-500">{desc}</p>
    </Link>
  );
}
