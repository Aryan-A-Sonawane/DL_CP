import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/apiHelpers";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return withAuth(["DEPT_HEAD"], async (user) => {
    const { id } = await context.params;
    const targetId = parseInt(id, 10);
    if (!user.departmentId || isNaN(targetId)) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    // Verify target employee is in the dept head's department
    const target = await prisma.user.findFirst({
      where: { id: targetId, departmentId: user.departmentId, role: "EMPLOYEE" },
      include: {
        strengths: true,
        certifications: true,
        newSkills: true,
        personalityTest: true,
      },
    });
    if (!target) {
      return NextResponse.json({ error: "Employee not found in your department" }, { status: 404 });
    }

    const [suggestions, records, failureEvents] = await Promise.all([
      prisma.roleSuggestion.findMany({
        where: { userId: targetId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.performanceRecord.findMany({
        where: { userId: targetId },
        orderBy: { cycleStart: "desc" },
        take: 12,
      }),
      prisma.failureEvent.findMany({
        where: { userId: targetId },
        orderBy: { date: "desc" },
        take: 20,
      }),
    ]);

    return NextResponse.json({
      employee: {
        id: target.id,
        name: target.name,
        email: target.email,
        empCode: target.empCode,
        primaryDomain: target.primaryDomain,
        yearsExperience: target.yearsExperience,
        softSkillScore: target.softSkillScore,
        profileComplete: target.profileComplete,
        strengths: target.strengths,
        certifications: target.certifications,
        newSkills: target.newSkills,
        personalityTest: target.personalityTest,
      },
      suggestions,
      records,
      failureEvents,
    });
  });
}
