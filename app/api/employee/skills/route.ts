import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/apiHelpers";

export async function POST(req: NextRequest) {
  return withAuth(["EMPLOYEE", "DEPT_HEAD"], async (user) => {
    const body = await req.json().catch(() => ({}));
    const name = String(body?.name ?? "").trim();
    const description = body?.description ? String(body.description).trim() : null;
    if (!name) return { error: "Skill name required." };
    const skill = await prisma.newSkill.create({
      data: { userId: user.id, name, description },
    });
    return { ok: true, skill };
  });
}
