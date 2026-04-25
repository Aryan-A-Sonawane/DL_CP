import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/apiHelpers";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth(["EMPLOYEE", "DEPT_HEAD"], async (user) => {
    const { id } = await params;
    const sid = Number(id);
    const skill = await prisma.newSkill.findUnique({ where: { id: sid } });
    if (!skill || skill.userId !== user.id) return { error: "Not found." };
    await prisma.newSkill.delete({ where: { id: sid } });
    return { ok: true };
  });
}
