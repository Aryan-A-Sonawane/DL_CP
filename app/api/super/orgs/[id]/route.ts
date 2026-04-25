import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/apiHelpers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth(["SUPER_ADMIN"], async () => {
    const { id } = await params;
    const orgId = Number(id);
    const body = await req.json().catch(() => ({}));
    const data: Record<string, unknown> = {};
    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (typeof body.active === "boolean") data.active = body.active;
    if (typeof body.industry === "string") data.industry = body.industry.trim() || null;
    if (Object.keys(data).length === 0) {
      return { error: "No updatable fields supplied." };
    }
    const updated = await prisma.organization.update({ where: { id: orgId }, data });
    return { ok: true, org: updated };
  });
}
