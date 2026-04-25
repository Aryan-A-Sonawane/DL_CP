import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/apiHelpers";

export async function POST(req: NextRequest) {
  return withAuth(["DEPT_HEAD"], async (user) => {
    if (!user.departmentId) return { error: "No department." };
    const body = await req.json().catch(() => ({}));
    const name = String(body?.name ?? "").trim();
    const description = String(body?.description ?? "").trim() || null;
    if (!name) return { error: "Project name required." };

    const exists = await prisma.project.findFirst({
      where: { departmentId: user.departmentId, name },
    });
    if (exists) return { error: "A project with that name already exists." };

    const project = await prisma.project.create({
      data: { departmentId: user.departmentId, name, description },
    });
    return { ok: true, project };
  });
}
