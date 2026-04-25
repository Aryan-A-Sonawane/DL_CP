import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/apiHelpers";

function clamp(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(10, n));
}

export async function PUT(req: NextRequest) {
  return withAuth(["EMPLOYEE", "DEPT_HEAD"], async (user) => {
    const body = await req.json().catch(() => ({}));
    const data = {
      openness: clamp(body?.openness),
      conscientiousness: clamp(body?.conscientiousness),
      extraversion: clamp(body?.extraversion),
      agreeableness: clamp(body?.agreeableness),
      neuroticism: clamp(body?.neuroticism),
    };
    const test = await prisma.personalityTest.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
    });
    return { ok: true, test };
  });
}
