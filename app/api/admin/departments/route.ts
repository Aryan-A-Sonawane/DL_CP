import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/apiHelpers";

export async function POST(req: NextRequest) {
  return withAuth(["ADMIN"], async (user) => {
    const body = await req.json().catch(() => ({}));
    const name = String(body?.name ?? "").trim();
    const cycleType = String(body?.cycleType ?? "monthly");
    const cycleLengthDays = Math.max(7, Math.min(400, Number(body?.cycleLengthDays) || 30));
    if (!name) return { error: "Department name required." };
    if (!user.orgId) return { error: "No organization context." };

    const exists = await prisma.department.findFirst({ where: { orgId: user.orgId, name } });
    if (exists) return { error: "A department with that name already exists." };

    const dept = await prisma.department.create({
      data: { orgId: user.orgId, name, cycleType, cycleLengthDays },
    });
    return { ok: true, department: dept };
  });
}

export async function GET() {
  return withAuth(["ADMIN", "DEPT_HEAD"], async (user) => {
    if (!user.orgId) return [];
    return prisma.department.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: "desc" },
    });
  });
}
