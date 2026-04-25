import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ProfileClient from "./ProfileClient";

export const dynamic = "force-dynamic";

export default async function EmployeeProfilePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYEE") redirect("/dashboard");

  const [skills, certs, personality] = await Promise.all([
    prisma.newSkill.findMany({ where: { userId: user.id }, orderBy: { learnedAt: "desc" } }),
    prisma.certification.findMany({ where: { userId: user.id }, orderBy: { obtainedAt: "desc" } }),
    prisma.personalityTest.findUnique({ where: { userId: user.id } }),
  ]);

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-surface-900">Profile & growth</h2>
        <p className="mt-1 text-sm text-surface-500">
          Keep your profile current — new skills, certifications, and a quick personality
          questionnaire all sharpen your role recommendations.
        </p>
      </div>

      <ProfileClient
        profile={{
          name: user.name,
          empCode: user.empCode,
          primaryDomain: user.primaryDomain,
          yearsExperience: user.yearsExperience,
          softSkillScore: user.softSkillScore,
          profileComplete: user.profileComplete,
        }}
        skills={skills.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          learnedAt: s.learnedAt.toISOString().slice(0, 10),
        }))}
        certifications={certs.map((c) => ({
          id: c.id,
          name: c.name,
          issuer: c.issuer,
          description: c.description,
          obtainedAt: c.obtainedAt.toISOString().slice(0, 10),
        }))}
        personality={personality}
      />
    </div>
  );
}
