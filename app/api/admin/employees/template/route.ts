import { NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHelpers";
import { generateEmployeeTemplate } from "@/lib/bulkImport/template";

export const runtime = "nodejs";

/**
 * GET /api/admin/employees/template
 *
 * Streams a blank `employees.xlsx` template the admin can hand to HR.
 * Two sheets: a header row with sample data + an Instructions sheet.
 */
export async function GET() {
  return withAuth(["ADMIN"], async () => {
    const buffer = await generateEmployeeTemplate();
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="employees-import-template.xlsx"',
        "Cache-Control": "no-store",
      },
    });
  });
}
