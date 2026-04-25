import ExcelJS from "exceljs";

/**
 * Build a blank `employees.xlsx` template the customer can hand to HR.
 *
 * Sheet 1 — "Employees" — headers + 2 example rows (one minimal, one full)
 *                         that the admin will delete before re-saving.
 * Sheet 2 — "Instructions" — quick reference for required columns,
 *                            accepted role values, and pipe-separated
 *                            formats for Strengths / Certifications.
 */
export async function generateEmployeeTemplate(): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Failure-to-Role Mapping Platform";
  wb.created = new Date();

  // ── Sheet 1: Employees ───────────────────────────────────────────────
  const ws = wb.addWorksheet("Employees");
  ws.columns = [
    { header: "Emp ID", key: "empId", width: 12 },
    { header: "First Name", key: "firstName", width: 16 },
    { header: "Last Name", key: "lastName", width: 16 },
    { header: "Email", key: "email", width: 28 },
    { header: "Department", key: "department", width: 22 },
    { header: "Role", key: "role", width: 12 },
    { header: "Years of Experience", key: "yoe", width: 14 },
    { header: "Soft Skill Score", key: "soft", width: 14 },
    { header: "Project", key: "project", width: 22 },
    { header: "Strengths", key: "strengths", width: 40 },
    { header: "Certifications", key: "certs", width: 28 },
  ];

  const header = ws.getRow(1);
  header.font = { bold: true };
  header.alignment = { horizontal: "center", vertical: "middle" };
  header.height = 22;
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEEF2FF" },
  };

  const requiredCols = [1, 2, 3, 4, 5];
  for (const colIdx of requiredCols) {
    header.getCell(colIdx).font = { bold: true, color: { argb: "FF4338CA" } };
  }

  ws.addRow({
    empId: "EMP-001",
    firstName: "Aanya",
    lastName: "Kapoor",
    email: "aanya.kapoor@yourcompany.com",
    department: "Engineering",
    role: "DEPT_HEAD",
    yoe: 8,
    soft: 8.5,
    project: "Apollo Migration",
    strengths: "Leadership:9 | Communication:8 | System Thinking:8",
    certs: "AWS Solutions Architect | CKA",
  });
  ws.addRow({
    empId: "EMP-002",
    firstName: "Rahul",
    lastName: "Mehta",
    email: "rahul.mehta@yourcompany.com",
    department: "Engineering",
    role: "EMPLOYEE",
    yoe: 3,
    soft: 6.5,
    project: "Apollo Migration",
    strengths: "Problem Solving:7 | Attention To Detail:7",
    certs: "",
  });

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    row.alignment = { vertical: "middle" };
  });

  // ── Sheet 2: Instructions ────────────────────────────────────────────
  const help = wb.addWorksheet("Instructions");
  help.columns = [
    { header: "Column", key: "col", width: 22 },
    { header: "Required?", key: "req", width: 11 },
    { header: "How to fill", key: "how", width: 80 },
  ];
  const helpHeader = help.getRow(1);
  helpHeader.font = { bold: true };
  helpHeader.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEEF2FF" },
  };

  const rows: [string, string, string][] = [
    ["Emp ID", "Yes", "Your internal employee code. Must be unique within your organization. Used as the join key for monthly performance uploads."],
    ["First Name", "Yes", "Letters/spaces. Used in the UI and emails."],
    ["Last Name", "Yes", "Letters/spaces."],
    ["Email", "Yes", "Valid email address. Must be unique platform-wide. Used for login and invitations."],
    ["Department", "Yes", "Plain name (e.g. \"Software Engineering\"). The platform will create it for you if it doesn't exist yet."],
    ["Role", "No", "Either EMPLOYEE (default) or DEPT_HEAD. Only one DEPT_HEAD per department — extras become EMPLOYEE."],
    ["Years of Experience", "No", "Number, e.g. 3 or 7.5. Defaults to 0 if blank."],
    ["Soft Skill Score", "No", "Number 0–10. HR's general read on communication, empathy, adaptability. Defaults to 5 if blank."],
    ["Project", "No", "Project name; auto-created in the person's department and an active assignment is added."],
    ["Strengths", "No", "Pipe-separated NAME:SCORE pairs (score 0–10). Example: Problem Solving:8 | Leadership:7. Drives the role-matching engine."],
    ["Certifications", "No", "Pipe-separated names. Example: AWS Solutions Architect | CKA | PMP."],
  ];
  for (const [c, r, h] of rows) help.addRow({ col: c, req: r, how: h });

  help.addRow([]);
  help.addRow(["What happens on import:"]);
  help.addRow(["", "", "• New email → user is created with an auto-generated 12-character password. Admin downloads a one-time credentials CSV."]);
  help.addRow(["", "", "• Existing email in your org → fields are updated in place (dept, role, soft-skill score, strengths, certs, project)."]);
  help.addRow(["", "", "• Inactive existing user → reactivated and updated."]);
  help.addRow(["", "", "• Email belongs to another organization → row is skipped with a clear reason in the result report."]);
  help.addRow(["", "", "• Strengths and Certifications are merged — existing entries are kept, new ones are added."]);

  help.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber > 1) row.alignment = { vertical: "top", wrapText: true };
  });

  const ab = await wb.xlsx.writeBuffer();
  return Buffer.from(ab as ArrayBuffer);
}
