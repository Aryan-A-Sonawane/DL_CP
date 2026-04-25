import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/apiHelpers";

export async function PATCH(req: NextRequest) {
  return withAuth(["DEPT_HEAD"], async (user) => {
    if (!user.departmentId) return { error: "No department." };
    const body = await req.json().catch(() => ({}));
    const cycleType = String(body?.cycleType ?? "monthly");
    const cycleLengthDays = Math.max(7, Math.min(400, Number(body?.cycleLengthDays) || 30));
    const anchorRaw = body?.cycleAnchor ? new Date(String(body.cycleAnchor)) : null;
    if (anchorRaw && Number.isNaN(anchorRaw.getTime())) {
      return { error: "Invalid cycle anchor date." };
    }
    const updated = await prisma.department.update({
      where: { id: user.departmentId },
      data: {
        cycleType,
        cycleLengthDays,
        ...(anchorRaw ? { cycleAnchor: anchorRaw } : {}),
      },
    });
    return { ok: true, department: updated };
  });
}
