import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/apiHelpers";

const VALID = new Set(["accepted", "rejected", "unsure"]);

export async function POST(req: NextRequest) {
  return withAuth(["EMPLOYEE", "DEPT_HEAD"], async (user) => {
    const body = await req.json().catch(() => ({}));
    const suggestionId = Number(body?.suggestionId);
    const decision = String(body?.decision ?? "");
    const desiredRole = body?.desiredRole ? String(body.desiredRole).trim() : null;
    const reason = body?.reason ? String(body.reason).trim() : null;

    if (!VALID.has(decision)) return { error: "Invalid decision." };
    const suggestion = await prisma.roleSuggestion.findUnique({ where: { id: suggestionId } });
    if (!suggestion || suggestion.userId !== user.id) return { error: "Suggestion not found." };

    const existing = await prisma.roleFeedback.findFirst({
      where: { userId: user.id, suggestionId },
    });
    const data = { decision, desiredRole, reason };
    const fb = existing
      ? await prisma.roleFeedback.update({ where: { id: existing.id }, data })
      : await prisma.roleFeedback.create({
          data: { userId: user.id, suggestionId, ...data },
        });
    return { ok: true, feedback: fb };
  });
}
