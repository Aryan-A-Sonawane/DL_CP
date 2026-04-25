import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth } from "@/lib/apiHelpers";
import { generateSampleExcel } from "@/lib/testData/generateExcel";

export const runtime = "nodejs";

/**
 * GET /api/admin/test-data/sample-excel
 *
 * Streams an .xlsx file pre-filled with the demo employees' performance data
 * for the current cycle. The returned file matches whatever was created by
 * `seed-software-engineering`, so the dept head can upload it as-is.
 */
export async function GET() {
  return withAuth(["ADMIN"], async (admin) => {
    if (!admin.orgId) {
      return NextResponse.json({ error: "No organization context." }, { status: 400 });
    }
    const org = await prisma.organization.findUnique({
      where: { id: admin.orgId },
      select: { name: true },
    });
    const buffer = await generateSampleExcel(org?.name ?? "Demo Organization");
    const filename = `software-engineering-cycle-${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  });
}
