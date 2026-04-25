import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/apiHelpers";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth(["EMPLOYEE", "DEPT_HEAD"], async (user) => {
    const { id } = await params;
    const cid = Number(id);
    const cert = await prisma.certification.findUnique({ where: { id: cid } });
    if (!cert || cert.userId !== user.id) return { error: "Not found." };
    await prisma.certification.delete({ where: { id: cid } });
    return { ok: true };
  });
}
