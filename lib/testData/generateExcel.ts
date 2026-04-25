import ExcelJS from "exceljs";
import { EMPLOYEES, type DemoEmployee } from "./softwareEngineering";

/**
 * Build an .xlsx buffer for the given organization that the dept head can
 * upload through `/dept/upload`. Header names match the aliases in `lib/excel.ts`
 * so parsing always works.
 *
 * One worksheet only — additional sheets are ignored by the parser anyway.
 */
export async function generateSampleExcel(orgName: string): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Failure-to-Role Mapping Platform";
  wb.created = new Date();

  const ws = wb.addWorksheet("Cycle Performance");

  ws.columns = [
    { header: "Emp ID", key: "empId", width: 12 },
    { header: "Emp Name", key: "name", width: 22 },
    { header: "Email", key: "email", width: 28 },
    { header: "Project", key: "project", width: 22 },
    { header: "Organization", key: "org", width: 22 },
    { header: "Productivity Cycles", key: "cycles", width: 14 },
    { header: "Hours per Cycle", key: "hpc", width: 14 },
    { header: "Hours Worked", key: "hoursWorked", width: 14 },
    { header: "Defects", key: "defects", width: 10 },
    { header: "Defect Fix Hours", key: "fixHours", width: 16 },
  ];

  ws.getRow(1).font = { bold: true };
  ws.getRow(1).alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 22;
  ws.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEEF2FF" },
  };

  for (const emp of EMPLOYEES) {
    ws.addRow({
      empId: emp.empCode,
      name: `${emp.firstName} ${emp.lastName}`,
      email: emp.email,
      project: emp.project,
      org: orgName,
      cycles: 1,
      hpc: emp.cycle1.hoursPerCycle,
      hoursWorked: emp.cycle1.hoursWorked,
      defects: emp.cycle1.defects,
      fixHours: emp.cycle1.defectFixHours,
    });
  }

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    row.alignment = { vertical: "middle" };
  });

  // exceljs returns its own Buffer-like; cast to Node Buffer for consumers.
  const ab = await wb.xlsx.writeBuffer();
  return Buffer.from(ab as ArrayBuffer);
}

export function totalEmployees(): number {
  return EMPLOYEES.length;
}

export function archetypeBreakdown(): Record<DemoEmployee["archetype"], number> {
  const counts: Record<DemoEmployee["archetype"], number> = {
    top: 0, senior: 0, mid: 0, struggler: 0, underused: 0, recoverer: 0,
  };
  for (const e of EMPLOYEES) counts[e.archetype]++;
  return counts;
}
