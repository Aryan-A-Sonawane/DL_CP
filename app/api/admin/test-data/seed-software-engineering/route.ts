import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/apiHelpers";
import { hashPassword } from "@/lib/auth";
import {
  DEPARTMENT_NAME,
  EMPLOYEES,
  PROJECTS,
  validateFixture,
} from "@/lib/testData/softwareEngineering";

export const runtime = "nodejs";

/**
 * POST /api/admin/test-data/seed-software-engineering
 *
 * Idempotent. Safe to call multiple times. Creates (or finds):
 *   - "Software Engineering" department in the caller's organization
 *   - 4 demo projects
 *   - 20 demo employees (password = `Firstname@12345`)
 *   - Strength records for each employee
 *   - Active project assignments
 *
 * Skips anything that already exists (matched by empCode / email / name).
 *
 * Returns a summary so the UI can display what changed.
 */
export async function POST() {
  return withAuth(["ADMIN"], async (admin) => {
    if (!admin.orgId) return { error: "No organization context." };
    validateFixture();

    let department = await prisma.department.findFirst({
      where: { orgId: admin.orgId, name: DEPARTMENT_NAME },
    });
    let createdDepartment = false;
    if (!department) {
      department = await prisma.department.create({
        data: {
          orgId: admin.orgId,
          name: DEPARTMENT_NAME,
          cycleType: "monthly",
          cycleLengthDays: 30,
        },
      });
      createdDepartment = true;
    }

    const projectByName = new Map<string, number>();
    let createdProjects = 0;
    for (const p of PROJECTS) {
      const existing = await prisma.project.findFirst({
        where: { departmentId: department.id, name: p.name },
      });
      if (existing) {
        projectByName.set(p.name, existing.id);
      } else {
        const created = await prisma.project.create({
          data: {
            departmentId: department.id,
            name: p.name,
            description: p.description,
            status: "active",
          },
        });
        projectByName.set(p.name, created.id);
        createdProjects++;
      }
    }

    let createdUsers = 0;
    let reactivatedUsers = 0;
    let createdAssignments = 0;
    let createdStrengths = 0;
    const skipped: { empCode: string; email: string; reason: string }[] = [];

    for (const emp of EMPLOYEES) {
      const fullName = `${emp.firstName} ${emp.lastName}`;
      const existingByEmail = await prisma.user.findUnique({
        where: { email: emp.email },
      });

      let userId: number;
      if (existingByEmail) {
        if (existingByEmail.orgId !== admin.orgId) {
          skipped.push({
            empCode: emp.empCode,
            email: emp.email,
            reason: "email belongs to another organization",
          });
          continue;
        }
        const updates: Parameters<typeof prisma.user.update>[0]["data"] = {};
        if (!existingByEmail.empCode) updates.empCode = emp.empCode;
        if (existingByEmail.departmentId !== department.id) {
          updates.departmentId = department.id;
        }
        if (!existingByEmail.active) {
          updates.active = true;
          reactivatedUsers++;
        }
        if (Object.keys(updates).length > 0) {
          await prisma.user.update({
            where: { id: existingByEmail.id },
            data: updates,
          });
        }
        userId = existingByEmail.id;
      } else {
        const passwordHash = await hashPassword(emp.password);
        const created = await prisma.user.create({
          data: {
            orgId: admin.orgId,
            departmentId: department.id,
            empCode: emp.empCode,
            name: fullName,
            email: emp.email,
            passwordHash,
            role: "EMPLOYEE",
            yearsExperience: emp.yearsExperience,
            softSkillScore: emp.softSkillScore,
            profileComplete: true,
            active: true,
          },
        });
        userId = created.id;
        createdUsers++;
      }

      const existingStrengths = await prisma.strength.findMany({
        where: { userId },
        select: { name: true },
      });
      const existingStrengthNames = new Set(
        existingStrengths.map((s) => s.name.toLowerCase()),
      );
      const newStrengths = emp.strengths.filter(
        (s) => !existingStrengthNames.has(s.name.toLowerCase()),
      );
      if (newStrengths.length > 0) {
        await prisma.strength.createMany({
          data: newStrengths.map((s) => ({
            userId,
            name: s.name,
            score: s.score,
            source: "assessment",
          })),
        });
        createdStrengths += newStrengths.length;
      }

      const projectId = projectByName.get(emp.project);
      if (projectId) {
        const openAssignment = await prisma.projectAssignment.findFirst({
          where: { userId, projectId, endedAt: null },
        });
        if (!openAssignment) {
          await prisma.projectAssignment.create({
            data: { userId, projectId },
          });
          createdAssignments++;
        }
      }
    }

    return {
      ok: true,
      department: { id: department.id, name: department.name, created: createdDepartment },
      summary: {
        projects: { total: PROJECTS.length, created: createdProjects },
        employees: {
          total: EMPLOYEES.length,
          created: createdUsers,
          reactivated: reactivatedUsers,
          alreadyExisted:
            EMPLOYEES.length - createdUsers - reactivatedUsers - skipped.length,
          skipped,
        },
        assignments: { created: createdAssignments },
        strengths: { created: createdStrengths },
      },
      passwordPattern: "Firstname@12345  (e.g. Aarav@12345, Priya@12345)",
    };
  });
}
