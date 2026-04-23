import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const empId = Number(id);
  if (!Number.isFinite(empId)) {
    return NextResponse.json({ detail: "Invalid id" }, { status: 400 });
  }

  const emp = await prisma.employee.findUnique({
    where: { id: empId },
    include: { failureEvents: true, strengths: true },
  });

  if (!emp) {
    return NextResponse.json({ detail: "Employee not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: emp.id,
    emp_code: emp.empCode,
    name: emp.name,
    email: emp.email,
    primary_domain: emp.primaryDomain,
    department: emp.department,
    years_experience: emp.yearsExperience,
    soft_skill_score: emp.softSkillScore,
    failure_events: emp.failureEvents.map((f) => ({
      id: f.id,
      category: f.category,
      description: f.description,
      severity: f.severity,
      date: f.date,
      recovery_time_days: f.recoveryTimeDays,
      outcome_after: f.outcomeAfter,
    })),
    strengths: emp.strengths.map((s) => ({
      id: s.id,
      name: s.name,
      score: s.score,
      source: s.source,
    })),
  });
}
