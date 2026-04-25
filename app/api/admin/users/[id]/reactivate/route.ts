import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/apiHelpers";

export const runtime = "nodejs";

/**
 * POST /api/admin/users/[id]/reactivate
 *
 * Re-enables a previously deactivated user. They keep their original role
 * and department but will need to be re-assigned to projects manually.
 *
 * Admin-only.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth(["ADMIN"], async (caller) => {
    const { id } = await params;
    const targetId = Number(id);
    if (!Number.isFinite(targetId)) return { error: "Invalid user id." };

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) return { error: "User not found." };
    if (target.orgId !== caller.orgId) {
      return { error: "User is not in your organization." };
    }
    if (target.active) return { ok: true, alreadyActive: true };

    await prisma.user.update({
      where: { id: targetId },
      data: { active: true },
    });
    return { ok: true };
  });
}
