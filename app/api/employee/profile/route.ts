import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/apiHelpers";

export async function PATCH(req: NextRequest) {
  return withAuth(["EMPLOYEE", "DEPT_HEAD"], async (user) => {
    const body = await req.json().catch(() => ({}));
    const data: Record<string, unknown> = {};
    if (typeof body?.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (body?.empCode !== undefined) data.empCode = body.empCode ? String(body.empCode).trim() : null;
    if (body?.primaryDomain !== undefined) data.primaryDomain = body.primaryDomain ? String(body.primaryDomain).trim() : null;
    if (body?.yearsExperience !== undefined) {
      const n = Math.max(0, Math.min(60, Number(body.yearsExperience) || 0));
      data.yearsExperience = n;
    }
    if (body?.softSkillScore !== undefined) {
      const n = Math.max(0, Math.min(10, Number(body.softSkillScore) || 0));
      data.softSkillScore = n;
    }
    data.profileComplete = true;

    if (data.empCode && data.empCode !== user.empCode) {
      const conflict = await prisma.user.findFirst({
        where: { orgId: user.orgId, empCode: data.empCode as string, NOT: { id: user.id } },
      });
      if (conflict) return { error: "That employee ID is already used in your org." };
    }

    const updated = await prisma.user.update({ where: { id: user.id }, data });
    return { ok: true, user: { id: updated.id, name: updated.name } };
  });
}
