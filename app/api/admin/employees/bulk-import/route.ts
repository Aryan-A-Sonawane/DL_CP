import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/apiHelpers";
import { hashPassword } from "@/lib/auth";
import { parseBulkEmployeesBuffer, type BulkRow } from "@/lib/bulkImport/parser";
import { generateInitialPassword } from "@/lib/bulkImport/password";

export const runtime = "nodejs";

interface CreatedCredential {
  empCode: string;
  name: string;
  email: string;
  department: string;
  role: "EMPLOYEE" | "DEPT_HEAD";
  password: string;
}

interface RowOutcome {
  rowNumber: number;
  empCode: string;
  email: string;
  status: "created" | "updated" | "reactivated" | "skipped" | "error";
  message?: string;
}

/**
 * POST /api/admin/employees/bulk-import
 *
 * Multipart upload of `employees.xlsx`. Idempotent. For every parsed row:
 *   - missing department → created in caller's org
 *   - missing project    → created in that department
 *   - new email          → user created with auto-generated password
 *   - existing email in same org → fields updated (dept, role, soft skill,
 *     strengths, certs, project assignment); reactivated if inactive
 *   - existing email in another org → skipped with reason
 *   - existing email is ADMIN/SUPER_ADMIN → skipped with reason
 *   - DEPT_HEAD requested but dept already has a head → demoted to EMPLOYEE
 *     for this row, with a warning
 *
 * Returns a per-row outcome list plus a `credentials` array containing the
 * one-time passwords for newly-created users. The client downloads that
 * as a CSV; we never store or re-show the plaintext passwords.
 */
export async function POST(req: NextRequest) {
  return withAuth(["ADMIN"], async (admin) => {
    if (!admin.orgId) {
      return NextResponse.json({ error: "No organization context." }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const parsed = await parseBulkEmployeesBuffer(buf);
    if (parsed.errors.some((e) => e.row === 1)) {
      return NextResponse.json(
        { error: parsed.errors[0].message, errors: parsed.errors },
        { status: 400 },
      );
    }
    if (parsed.rows.length === 0) {
      return NextResponse.json(
        {
          error: "No valid data rows found in the sheet.",
          errors: parsed.errors,
        },
        { status: 400 },
      );
    }

    const rowOutcomes: RowOutcome[] = parsed.errors.map((e) => ({
      rowNumber: e.row,
      empCode: "",
      email: "",
      status: "error",
      message: e.message,
    }));

    // Pre-resolve / create departments referenced in the sheet
    const wantedDeptNames = Array.from(
      new Set(parsed.rows.map((r) => r.department).filter(Boolean)),
    );
    const existingDepts = await prisma.department.findMany({
      where: { orgId: admin.orgId, name: { in: wantedDeptNames } },
    });
    const deptByName = new Map<string, { id: number; headId: number | null }>(
      existingDepts.map((d) => [d.name, { id: d.id, headId: d.headId }]),
    );
    let createdDepartments = 0;
    for (const name of wantedDeptNames) {
      if (!deptByName.has(name)) {
        const created = await prisma.department.create({
          data: {
            orgId: admin.orgId,
            name,
            cycleType: "monthly",
            cycleLengthDays: 30,
          },
        });
        deptByName.set(name, { id: created.id, headId: null });
        createdDepartments++;
      }
    }

    // Track headship assignments so we never assign a second DEPT_HEAD per dept
    const deptHeadAssignedThisRun = new Set<number>(
      Array.from(deptByName.values())
        .filter((d) => d.headId !== null)
        .map((d) => d.id),
    );

    const credentials: CreatedCredential[] = [];
    let createdProjects = 0;
    let createdAssignments = 0;
    let mergedStrengths = 0;
    let mergedCerts = 0;

    for (const row of parsed.rows) {
      try {
        const dept = deptByName.get(row.department);
        if (!dept) {
          rowOutcomes.push({
            rowNumber: row.rowNumber,
            empCode: row.empCode,
            email: row.email,
            status: "error",
            message: `Department "${row.department}" could not be resolved.`,
          });
          continue;
        }

        let resolvedRole: "EMPLOYEE" | "DEPT_HEAD" = row.role;
        let demotionNote: string | undefined;
        if (resolvedRole === "DEPT_HEAD") {
          if (deptHeadAssignedThisRun.has(dept.id)) {
            resolvedRole = "EMPLOYEE";
            demotionNote = `Department "${row.department}" already has a head — imported as EMPLOYEE.`;
          }
        }

        const fullName = `${row.firstName} ${row.lastName}`.trim();

        const outcome = await upsertUser({
          orgId: admin.orgId,
          row,
          fullName,
          departmentId: dept.id,
          resolvedRole,
        });

        if (outcome.kind === "skipped") {
          rowOutcomes.push({
            rowNumber: row.rowNumber,
            empCode: row.empCode,
            email: row.email,
            status: "skipped",
            message: outcome.reason,
          });
          continue;
        }

        const userId = outcome.userId;

        if (outcome.kind === "created") {
          credentials.push({
            empCode: row.empCode,
            name: fullName,
            email: row.email,
            department: row.department,
            role: resolvedRole,
            password: outcome.password,
          });
        }

        if (resolvedRole === "DEPT_HEAD") {
          await prisma.department.update({
            where: { id: dept.id },
            data: { headId: userId },
          });
          deptByName.set(row.department, { id: dept.id, headId: userId });
          deptHeadAssignedThisRun.add(dept.id);
        }

        // Strengths — merge by case-insensitive name
        if (row.strengths.length > 0) {
          const existingStrengths = await prisma.strength.findMany({
            where: { userId },
            select: { name: true },
          });
          const existingNames = new Set(
            existingStrengths.map((s) => s.name.toLowerCase()),
          );
          const toCreate = row.strengths.filter(
            (s) => !existingNames.has(s.name.toLowerCase()),
          );
          if (toCreate.length > 0) {
            await prisma.strength.createMany({
              data: toCreate.map((s) => ({
                userId,
                name: s.name,
                score: s.score,
                source: "import",
              })),
            });
            mergedStrengths += toCreate.length;
          }
        }

        // Certifications — merge by case-insensitive name
        if (row.certifications.length > 0) {
          const existingCerts = await prisma.certification.findMany({
            where: { userId },
            select: { name: true },
          });
          const existingCertNames = new Set(
            existingCerts.map((c) => c.name.toLowerCase()),
          );
          const certsToCreate = row.certifications.filter(
            (c) => !existingCertNames.has(c.toLowerCase()),
          );
          if (certsToCreate.length > 0) {
            await prisma.certification.createMany({
              data: certsToCreate.map((name) => ({ userId, name })),
            });
            mergedCerts += certsToCreate.length;
          }
        }

        // Project — auto-create + active assignment
        if (row.project) {
          let project = await prisma.project.findFirst({
            where: { departmentId: dept.id, name: row.project },
          });
          if (!project) {
            project = await prisma.project.create({
              data: {
                departmentId: dept.id,
                name: row.project,
                status: "active",
              },
            });
            createdProjects++;
          }
          const openAssignment = await prisma.projectAssignment.findFirst({
            where: { userId, projectId: project.id, endedAt: null },
          });
          if (!openAssignment) {
            await prisma.projectAssignment.create({
              data: { userId, projectId: project.id },
            });
            createdAssignments++;
          }
        }

        rowOutcomes.push({
          rowNumber: row.rowNumber,
          empCode: row.empCode,
          email: row.email,
          status: outcome.kind,
          message: demotionNote,
        });
      } catch (err) {
        console.error("[bulk-import] row failed", row.rowNumber, err);
        rowOutcomes.push({
          rowNumber: row.rowNumber,
          empCode: row.empCode,
          email: row.email,
          status: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    rowOutcomes.sort((a, b) => a.rowNumber - b.rowNumber);

    const counts = {
      total: parsed.rows.length,
      created: rowOutcomes.filter((o) => o.status === "created").length,
      updated: rowOutcomes.filter((o) => o.status === "updated").length,
      reactivated: rowOutcomes.filter((o) => o.status === "reactivated").length,
      skipped: rowOutcomes.filter((o) => o.status === "skipped").length,
      errored: rowOutcomes.filter((o) => o.status === "error").length,
    };

    return {
      ok: true,
      counts,
      departments: { created: createdDepartments, total: deptByName.size },
      projects: { created: createdProjects },
      assignments: { created: createdAssignments },
      strengths: { added: mergedStrengths },
      certifications: { added: mergedCerts },
      rowOutcomes,
      credentials,
    };
  });
}

type UpsertOutcome =
  | { kind: "created"; userId: number; password: string }
  | { kind: "updated"; userId: number }
  | { kind: "reactivated"; userId: number }
  | { kind: "skipped"; reason: string };

async function upsertUser(args: {
  orgId: number;
  row: BulkRow;
  fullName: string;
  departmentId: number;
  resolvedRole: "EMPLOYEE" | "DEPT_HEAD";
}): Promise<UpsertOutcome> {
  const { orgId, row, fullName, departmentId, resolvedRole } = args;

  const existing = await prisma.user.findUnique({ where: { email: row.email } });

  if (existing) {
    if (existing.orgId !== orgId) {
      return {
        kind: "skipped",
        reason: "Email belongs to another organization.",
      };
    }
    if (existing.role === "ADMIN" || existing.role === "SUPER_ADMIN") {
      return {
        kind: "skipped",
        reason: `Email belongs to an ${existing.role}. Manage their account separately.`,
      };
    }

    const wasInactive = !existing.active;
    const movingDept =
      existing.departmentId !== null && existing.departmentId !== departmentId;

    const updates: Parameters<typeof prisma.user.update>[0]["data"] = {
      name: fullName,
      empCode: row.empCode,
      role: resolvedRole,
      departmentId,
      yearsExperience: row.yearsExperience,
      softSkillScore: row.softSkillScore,
      active: true,
      profileComplete: true,
    };

    await prisma.user.update({ where: { id: existing.id }, data: updates });

    // If they're moving departments, end any open project assignments and
    // clear an outdated headship — same logic as the invitations endpoint.
    if (movingDept) {
      await prisma.projectAssignment.updateMany({
        where: { userId: existing.id, endedAt: null },
        data: { endedAt: new Date() },
      });
      if (existing.role === "DEPT_HEAD" && existing.departmentId !== null) {
        await prisma.department.update({
          where: { id: existing.departmentId },
          data: { headId: null },
        });
      }
    }

    return wasInactive
      ? { kind: "reactivated", userId: existing.id }
      : { kind: "updated", userId: existing.id };
  }

  // Brand-new user
  const password = generateInitialPassword();
  const passwordHash = await hashPassword(password);
  const created = await prisma.user.create({
    data: {
      orgId,
      departmentId,
      empCode: row.empCode,
      name: fullName,
      email: row.email,
      passwordHash,
      role: resolvedRole,
      yearsExperience: row.yearsExperience,
      softSkillScore: row.softSkillScore,
      profileComplete: true,
      active: true,
    },
  });

  return { kind: "created", userId: created.id, password };
}
