import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/apiHelpers";

export async function POST(req: NextRequest) {
  return withAuth(["EMPLOYEE", "DEPT_HEAD"], async (user) => {
    const body = await req.json().catch(() => ({}));
    const name = String(body?.name ?? "").trim();
    const issuer = body?.issuer ? String(body.issuer).trim() : null;
    const description = body?.description ? String(body.description).trim() : null;
    if (!name) return { error: "Certification name required." };
    const cert = await prisma.certification.create({
      data: { userId: user.id, name, issuer, description },
    });
    return { ok: true, certification: cert };
  });
}
