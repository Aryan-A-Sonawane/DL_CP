import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Users,
  Activity,
  Target,
  Brain,
  Upload,
  GitBranch,
  type LucideIcon,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDeptCycleStatus } from "@/lib/reminders";
import ReminderBanner from "@/components/ReminderBanner";

export const dynamic = "force-dynamic";

export default async function DeptOverview() {
  const user = await getCurrentUser();
  if (!user || user.role !== "DEPT_HEAD") redirect("/dashboard");
  if (!user.departmentId) {
    return <NoDeptYet />;
  }

  const dept = await prisma.department.findUnique({
    where: { id: user.departmentId },
    include: {
      _count: { select: { members: true, projects: true, uploads: true } },
    },
  });
  if (!dept) redirect("/dashboard");

  const status = await getDeptCycleStatus(dept.id);

  const cycleRecords = await prisma.performanceRecord.findMany({
    where: {
      user: { departmentId: dept.id },
      cycleStart: status.cycle.start,
      cycleEnd: status.cycle.end,
    },
  });
  const totalMembers = dept._count.members;
  const analyzed = new Set(cycleRecords.map((r) => r.userId)).size;
  const reviewed = await prisma.roleFeedback.count({
    where: { user: { departmentId: dept.id }, suggestion: { cycleStart: status.cycle.start } },
  });

  const avgHoursWorked =
    cycleRecords.length > 0
      ? cycleRecords.reduce((a, b) => a + b.hoursWorked, 0) / cycleRecords.length
      : 0;
  const avgTAT =
    cycleRecords.length > 0
      ? cycleRecords.reduce((a, b) => a + b.avgTurnAroundHours, 0) / cycleRecords.length
      : 0;

  const newSkillsCount = await prisma.newSkill.count({
    where: { user: { departmentId: dept.id } },
  });

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-surface-900">{dept.name}</h2>
          <p className="mt-1 text-sm text-surface-500">
            Cycle {status.cycle.start.toLocaleDateString()} →{" "}
            {status.cycle.end.toLocaleDateString()} · {dept.cycleType}
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

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Users} label="People in department" value={totalMembers} colorClass="stat-card-indigo" iconBg="bg-primary-50" iconColor="text-primary-500" />
        <Stat icon={Brain} label="Analyzed by model" value={analyzed} colorClass="stat-card-violet" iconBg="bg-violet-50" iconColor="text-violet-500" sub={`out of ${totalMembers} this cycle`} />
        <Stat icon={Target} label="Self-reviews submitted" value={reviewed} colorClass="stat-card-emerald" iconBg="bg-emerald-50" iconColor="text-emerald-500" />
        <Stat icon={Activity} label="Avg work hours" value={avgHoursWorked.toFixed(1)} colorClass="stat-card-amber" iconBg="bg-amber-50" iconColor="text-amber-500" sub="per record this cycle" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card-soft p-6">
          <p className="text-xs uppercase font-semibold text-surface-400 tracking-wider">
            Avg turn-around time / defect
          </p>
          <p className="mt-2 text-3xl font-extrabold text-surface-900">
            {cycleRecords.length === 0 ? "—" : `${avgTAT.toFixed(2)} h`}
          </p>
          <p className="mt-1 text-xs text-surface-400">
            {cycleRecords.length === 0
              ? "Upload a cycle report to compute"
              : `from ${cycleRecords.length} performance ${
                  cycleRecords.length === 1 ? "record" : "records"
                }`}
          </p>
        </div>
        <div className="card-soft p-6">
          <p className="text-xs uppercase font-semibold text-surface-400 tracking-wider">
            New skills logged
          </p>
          <p className="mt-2 text-3xl font-extrabold text-surface-900">{newSkillsCount}</p>
          <p className="mt-1 text-xs text-surface-400">
            Holistic growth tracked from employee profiles
          </p>
        </div>
        <div className="card-soft p-6">
          <p className="text-xs uppercase font-semibold text-surface-400 tracking-wider">
            Projects active
          </p>
          <p className="mt-2 text-3xl font-extrabold text-surface-900">{dept._count.projects}</p>
          <p className="mt-1 text-xs text-surface-400">
            {dept._count.uploads} {dept._count.uploads === 1 ? "upload" : "uploads"} so far
          </p>
        </div>
      </section>

      <section className="card p-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-surface-900">Quick actions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickLink href="/dept/people" icon={Users} title="Manage people" desc="View members, invite employees." />
          <QuickLink href="/dept/projects" icon={GitBranch} title="Projects" desc="Create projects and assign people." />
          <QuickLink href="/dept/settings" icon={Target} title="Cycle settings" desc="Change cadence, anchor and reminders." />
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
          Your org admin needs to assign you as the head of a department before
          you can manage projects, upload cycle reports or view dept analytics.
        </p>
        <p className="text-sm text-surface-400 mt-3">
          Ping your admin to redeem your invite under the department you should be heading.
        </p>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  colorClass,
  iconBg,
  iconColor,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  colorClass: string;
  iconBg: string;
  iconColor: string;
  sub?: string;
}) {
  return (
    <div className={`stat-card ${colorClass}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-surface-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-surface-400">{sub}</p>}
        </div>
        <div className={`rounded-xl ${iconBg} p-3`}>
          <Icon size={20} className={iconColor} />
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href} className="card-soft p-5 no-underline block hover:border-primary-200 transition">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50">
        <Icon size={16} className="text-primary-500" />
      </div>
      <h4 className="mt-3 font-semibold text-surface-900">{title}</h4>
      <p className="mt-1 text-xs text-surface-500">{desc}</p>
    </Link>
  );
}
