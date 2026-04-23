import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const suggestions = await prisma.roleSuggestion.findMany({
    orderBy: { createdAt: "desc" },
    include: { employee: true },
  });

  return NextResponse.json(
    suggestions.map((s) => ({
      id: s.id,
      employee_id: s.employeeId,
      employee_name: s.employee?.name ?? "Unknown",
      suggested_role: s.suggestedRole,
      match_score: s.matchScore,
      failure_score: s.failureScore,
      resilience_index: s.resilienceIndex,
      leadership_score: s.leadershipScore,
      growth_trajectory: s.growthTrajectory,
      explanation: s.explanation,
      created_at: s.createdAt.toISOString(),
    })),
  );
}
