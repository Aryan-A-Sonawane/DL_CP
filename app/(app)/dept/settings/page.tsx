import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function DeptSettingsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "DEPT_HEAD" || !user.departmentId) redirect("/dashboard");

  const dept = await prisma.department.findUnique({ where: { id: user.departmentId } });
  if (!dept) redirect("/dashboard");

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">Cycle settings</h2>
        <p className="mt-1 text-sm text-surface-500">
          Configure the productivity cycle cadence for {dept.name}. Reminders fire 10, 7, 5, 3,
          2, 1 days before and on the cycle end day until a report is uploaded.
        </p>
      </div>

      <div className="card p-7 max-w-2xl">
        <SettingsForm
          deptId={dept.id}
          name={dept.name}
          cycleType={dept.cycleType}
          cycleLengthDays={dept.cycleLengthDays}
          cycleAnchor={dept.cycleAnchor.toISOString().slice(0, 10)}
        />
      </div>
    </div>
  );
}
