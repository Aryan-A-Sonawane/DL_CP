import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/apiHelpers";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return withAuth(["ADMIN", "SUPER_ADMIN"], async (user) => {
    if (!user.orgId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }
    const orgId = user.orgId;

    // Org-wide aggregated stats from roleSuggestions
    const suggestions = await prisma.roleSuggestion.findMany({
      where: { user: { orgId } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: {
          select: { name: true, empCode: true, department: { select: { name: true } } },
        },
      },
    });

    // Average scores per department
    const depts = await prisma.department.findMany({
      where: { orgId },
      select: { id: true, name: true },
    });

    const deptStats = await Promise.all(
      depts.map(async (d) => {
        const agg = await prisma.roleSuggestion.aggregate({
          where: { user: { departmentId: d.id } },
          _avg: {
            resilienceIndex: true,
            failureScore: true,
            leadershipScore: true,
            matchScore: true,
          },
          _count: { id: true },
        });
        return {
          department: d.name,
          avgResilience: Math.round((agg._avg.resilienceIndex ?? 0) * 10) / 10,
          avgFailure: Math.round((agg._avg.failureScore ?? 0) * 10) / 10,
          avgLeadership: Math.round((agg._avg.leadershipScore ?? 0) * 10) / 10,
          avgMatch: Math.round((agg._avg.matchScore ?? 0) * 10) / 10,
          analysisCount: agg._count.id,
        };
      }),
    );

    // Org-wide averages
    const orgAgg = await prisma.roleSuggestion.aggregate({
      where: { user: { orgId } },
      _avg: { resilienceIndex: true, failureScore: true, leadershipScore: true },
    });

    // Trajectory distribution
    const trajectories = await prisma.roleSuggestion.groupBy({
      by: ["growthTrajectory"],
      where: { user: { orgId } },
      _count: { id: true },
    });

    return NextResponse.json({
      recentSuggestions: suggestions.map((s) => ({
        id: s.id,
        employeeName: s.user.name,
        empCode: s.user.empCode,
        department: s.user.department?.name ?? "—",
        suggestedRole: s.suggestedRole,
        matchScore: s.matchScore,
        resilienceIndex: s.resilienceIndex,
        growthTrajectory: s.growthTrajectory,
        createdAt: s.createdAt,
      })),
      deptStats: deptStats.filter((d) => d.analysisCount > 0),
      orgAvg: {
        resilience: Math.round((orgAgg._avg.resilienceIndex ?? 0) * 10) / 10,
        failure: Math.round((orgAgg._avg.failureScore ?? 0) * 10) / 10,
        leadership: Math.round((orgAgg._avg.leadershipScore ?? 0) * 10) / 10,
      },
      trajectoryDistribution: trajectories.map((t) => ({
        trajectory: t.growthTrajectory,
        count: t._count.id,
      })),
    });
  });
}
