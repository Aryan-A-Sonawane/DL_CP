import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/apiHelpers";
import { activeCycleWindow } from "@/lib/cycles";
import { parseExcelBuffer } from "@/lib/excel";
import { runAnalysisForUser } from "@/lib/engine/runAnalysis";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return withAuth(["DEPT_HEAD"], async (user) => {
    if (!user.departmentId) {
      return NextResponse.json({ error: "No department." }, { status: 400 });
    }
    const dept = await prisma.department.findUnique({ where: { id: user.departmentId } });
    if (!dept) return NextResponse.json({ error: "Department missing." }, { status: 400 });

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const parsed = await parseExcelBuffer(buf);
    if (parsed.errors.some((e) => e.row === 1)) {
      return NextResponse.json(
        { error: parsed.errors[0].message, errors: parsed.errors },
        { status: 400 },
      );
    }
    if (parsed.rows.length === 0) {
      return NextResponse.json(
        { error: "No data rows found in the sheet.", errors: parsed.errors },
        { status: 400 },
      );
    }

    const cycle = activeCycleWindow(dept.cycleAnchor, dept.cycleLengthDays);

    // Match rows to existing dept members by empCode (preferred) or email
    const codes = parsed.rows.map((r) => r.empCode).filter(Boolean);
    const emails = parsed.rows.map((r) => r.email).filter(Boolean);
    const candidates = await prisma.user.findMany({
      where: {
        departmentId: dept.id,
        OR: [{ empCode: { in: codes } }, { email: { in: emails } }],
      },
      select: { id: true, empCode: true, email: true },
    });
    const byCode = new Map(candidates.filter((c) => c.empCode).map((c) => [c.empCode!, c.id]));
    const byEmail = new Map(candidates.map((c) => [c.email.toLowerCase(), c.id]));

    const upload = await prisma.excelUpload.create({
      data: {
        departmentId: dept.id,
        uploadedById: user.id,
        cycleStart: cycle.start,
        cycleEnd: cycle.end,
        fileName: file.name,
        rowCount: parsed.rows.length,
      },
    });

    const unmatched: { empCode: string; email: string; reason: string }[] = [];
    const matchedUserIds: number[] = [];

    for (const row of parsed.rows) {
      const userId =
        (row.empCode && byCode.get(row.empCode)) || byEmail.get(row.email.toLowerCase());
      if (!userId) {
        unmatched.push({
          empCode: row.empCode,
          email: row.email,
          reason: "not in department members",
        });
        continue;
      }
      // Backfill empCode if user didn't have one
      if (row.empCode) {
        await prisma.user
          .update({ where: { id: userId }, data: { empCode: row.empCode } })
          .catch(() => {/* ignore unique conflict */});
      }
      const tat = row.defects > 0 ? row.defectFixHours / row.defects : 0;
      const onTime = row.hoursWorked >= row.hoursPerCycle * 0.85;
      await prisma.performanceRecord.create({
        data: {
          uploadId: upload.id,
          userId,
          projectName: row.project || null,
          cycleStart: cycle.start,
          cycleEnd: cycle.end,
          productivityCycles: row.productivityCycles,
          hoursPerCycle: row.hoursPerCycle,
          hoursWorked: row.hoursWorked,
          defects: row.defects,
          defectFixHours: row.defectFixHours,
          avgTurnAroundHours: Math.round(tat * 100) / 100,
          onTimeSubmission: onTime,
        },
      });
      matchedUserIds.push(userId);
    }

    const uniqueUsers = [...new Set(matchedUserIds)];
    for (const uid of uniqueUsers) {
      try {
        await runAnalysisForUser(uid, { cycleStart: cycle.start, cycleEnd: cycle.end });
      } catch (err) {
        console.error(`[engine] analysis failed for user ${uid}`, err);
      }
    }

    return NextResponse.json({
      ok: true,
      uploadId: upload.id,
      inserted: matchedUserIds.length,
      matched: uniqueUsers.length,
      unmatched,
      errors: parsed.errors,
    });
  });
}
