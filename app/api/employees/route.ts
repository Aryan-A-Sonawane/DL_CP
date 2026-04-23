import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const titleCase = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? undefined;
  const domain = searchParams.get("domain") ?? undefined;

  const employees = await prisma.employee.findMany({
    where: {
      ...(search ? { name: { contains: search } } : {}),
      ...(domain ? { primaryDomain: { contains: domain } } : {}),
    },
    orderBy: { id: "asc" },
    include: { failureEvents: true, strengths: true },
  });

  const result = employees.map((emp) => {
    const cats = emp.failureEvents.map((f) => f.category);
    let repeated = "None";
    if (cats.length) {
      const counts = new Map<string, number>();
      for (const c of cats) counts.set(c, (counts.get(c) ?? 0) + 1);
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      repeated = titleCase(top);
    }

    const topStrengths = [...emp.strengths]
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((s) => s.name);

    return {
      id: emp.id,
      emp_code: emp.empCode,
      name: emp.name,
      primary_domain: emp.primaryDomain,
      department: emp.department,
      years_experience: emp.yearsExperience,
      soft_skill_score: emp.softSkillScore,
      repeated_failure_area: repeated,
      top_strengths: topStrengths,
    };
  });

  return NextResponse.json(result);
}
