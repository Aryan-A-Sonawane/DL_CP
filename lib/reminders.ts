import { prisma } from "./db";
import { activeCycleWindow, shouldShowReminder } from "./cycles";

export interface DeptCycleStatus {
  cycle: ReturnType<typeof activeCycleWindow>;
  uploadedThisCycle: boolean;
  showReminder: boolean;
}

export async function getDeptCycleStatus(departmentId: number): Promise<DeptCycleStatus> {
  const dept = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { cycleAnchor: true, cycleLengthDays: true },
  });
  if (!dept) throw new Error("Department not found");
  const cycle = activeCycleWindow(dept.cycleAnchor, dept.cycleLengthDays);

  const uploaded = await prisma.excelUpload.findFirst({
    where: {
      departmentId,
      cycleStart: cycle.start,
      cycleEnd: cycle.end,
    },
    select: { id: true },
  });

  const uploadedThisCycle = Boolean(uploaded);
  const showReminder = !uploadedThisCycle && shouldShowReminder(cycle.daysToGo);

  if (showReminder) {
    await prisma.reminderLog
      .create({
        data: {
          departmentId,
          cycleEnd: cycle.end,
          daysToGo: cycle.daysToGo,
        },
      })
      .catch(() => {/* unique constraint on (dept,cycle,daysToGo) — already logged */});
  }

  return { cycle, uploadedThisCycle, showReminder };
}
