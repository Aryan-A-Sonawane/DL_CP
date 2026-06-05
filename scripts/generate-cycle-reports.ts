/**
 * generate-cycle-reports.ts
 *
 * Generates 4 upload-ready monthly cycle reports (Feb → May 2026) for the
 * REAL members of the Software Engineering department, pulled live from the DB
 * so every row matches an existing user by empCode / email.
 *
 * The reports follow the full upload schema in lib/excel.ts, including:
 *   - the required Role column (employee | Intern)
 *   - an explicit Cycle Start / Cycle End so each upload lands on its own month
 *     (the upload route honours these instead of the current cycle window)
 *
 * The numbers describe a deliberate improvement arc so the dashboard's trend
 * lines, Six Sigma control chart and resilience trajectory all light up:
 *   Feb  baseline (rough) → Mar recovery → Apr progress → May strong
 *
 * Usage:  npx tsx scripts/generate-cycle-reports.ts [departmentId]
 */
import ExcelJS from "exceljs";
import { mkdirSync } from "fs";
import path from "path";
import { prisma } from "../lib/db";

const DEPT_ID = Number(process.argv[2] ?? 1);

const PROJECTS = [
  "Customer Portal v2",
  "Inventory Management System",
  "Data Pipeline Overhaul",
  "Mobile Banking App",
  "CRM Integration Suite",
];
const LIFECYCLES = ["Scrum", "Kanban", "SAFe", "XP", "Waterfall"];
const PHASES = [
  "Sprint Execution", "Sprint Planning", "Sprint Review", "Integration & Testing",
  "Analysis", "Deployment", "UAT", "Backlog Refinement",
];

const CYCLES = [
  { label: "Feb 2026", file: "software-engineering-feb-2026.xlsx", idx: 0, start: new Date("2026-02-01"), end: new Date("2026-02-28") },
  { label: "Mar 2026", file: "software-engineering-mar-2026.xlsx", idx: 1, start: new Date("2026-03-01"), end: new Date("2026-03-31") },
  { label: "Apr 2026", file: "software-engineering-apr-2026.xlsx", idx: 2, start: new Date("2026-04-01"), end: new Date("2026-04-30") },
  { label: "May 2026", file: "software-engineering-may-2026.xlsx", idx: 3, start: new Date("2026-05-01"), end: new Date("2026-05-31") },
];

// Seeded PRNG so the same employees always get the same numbers.
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

interface Member {
  empCode: string | null;
  name: string;
  email: string;
  softSkillScore: number;
  yearsExperience: number;
}

function buildRow(emp: Member, empIndex: number, cycleIdx: number, orgName: string, deptName: string, cycle: (typeof CYCLES)[number]) {
  const rng = makeRng(7331 + empIndex * 101 + cycleIdx * 1337);
  const rndI = (lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));
  const rndF = (lo: number, hi: number, dp = 1) => parseFloat((lo + rng() * (hi - lo)).toFixed(dp));
  const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)];

  const ss = emp.softSkillScore || 6;

  // Improvement multiplier per cycle — different slope by skill tier.
  const improveMult = (
    ss >= 8   ? [1.00, 1.02, 1.04, 1.06] :
    ss >= 7   ? [0.78, 0.86, 0.93, 1.00] :
    ss >= 6.5 ? [0.68, 0.78, 0.88, 0.96] :
                [0.55, 0.66, 0.76, 0.85]
  )[cycleIdx];

  // Capacity is stable per person across cycles.
  const hoursPerCycle = [80, 120, 160][empIndex % 3];
  const hoursWorked = rndF(hoursPerCycle * improveMult * 0.88, hoursPerCycle * improveMult * 1.0);

  const baseDefects =
    ss >= 8 ? rndI(0, 4) : ss >= 7 ? rndI(3, 10) : ss >= 6.5 ? rndI(6, 16) : rndI(10, 22);
  const defectReduction = [1.0, 0.78, 0.6, 0.45][cycleIdx];
  const defects = Math.max(0, Math.round(baseDefects * defectReduction));

  const fixTimePerDefect =
    ss >= 8 ? rndF(0.8, 2.0) : ss >= 7 ? rndF(2.0, 4.5) : ss >= 6.5 ? rndF(4.0, 7.5) : rndF(6.0, 12.0);
  const fixTimeReduction = [1.0, 0.82, 0.66, 0.55][cycleIdx];
  const defectFixHours =
    defects > 0
      ? rndF(defects * fixTimePerDefect * fixTimeReduction * 0.7, defects * fixTimePerDefect * fixTimeReduction)
      : 0;

  return {
    "Emp ID": emp.empCode ?? "",
    "Emp Name": emp.name,
    "Email": emp.email,
    "Role": emp.yearsExperience <= 2 ? "Intern" : "employee",
    "Project": PROJECTS[empIndex % PROJECTS.length],
    "Organization": orgName,
    "Department": deptName,
    "Productivity Cycles": rndI(1, 3),
    "Hours per Cycle": hoursPerCycle,
    "Hours Worked": parseFloat(hoursWorked.toFixed(1)),
    "Defects": defects,
    "Defect Fix Time Hours": parseFloat(defectFixHours.toFixed(1)),
    "Lifecycle": pick(LIFECYCLES),
    "Phase": pick(PHASES),
    "Cycle Start": cycle.start,
    "Cycle End": cycle.end,
  };
}

async function main() {
  const dept = await prisma.department.findUnique({
    where: { id: DEPT_ID },
    include: { organization: { select: { name: true } } },
  });
  if (!dept) throw new Error(`Department ${DEPT_ID} not found`);

  const members = await prisma.user.findMany({
    where: { departmentId: DEPT_ID, role: "EMPLOYEE" },
    select: { empCode: true, name: true, email: true, softSkillScore: true, yearsExperience: true },
    orderBy: { name: "asc" },
  });
  console.log(`Dept ${DEPT_ID} "${dept.name}" (${dept.organization?.name}) — ${members.length} employees`);
  if (!members.length) throw new Error("No EMPLOYEE members to report on.");

  const outDir = path.join(__dirname, "../public/excel_reports");
  mkdirSync(outDir, { recursive: true });

  for (const cycle of CYCLES) {
    const wb = new ExcelJS.Workbook();
    wb.creator = "DL_CP Platform";
    const ws = wb.addWorksheet("Cycle Report");

    const rows = members.map((m, i) =>
      buildRow(m as Member, i, cycle.idx, dept.organization?.name ?? "Passion Infotech", dept.name, cycle),
    );
    const headers = Object.keys(rows[0]);
    ws.columns = headers.map((h) => ({
      header: h,
      key: h,
      width: h === "Email" ? 30 : h === "Emp Name" || h.startsWith("Cycle") ? 18 : h === "Project" ? 26 : 14,
    }));
    ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
    ws.getRow(1).alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(1).height = 22;

    for (const r of rows) ws.addRow(r);

    // Format the date columns.
    const csCol = headers.indexOf("Cycle Start") + 1;
    const ceCol = headers.indexOf("Cycle End") + 1;
    ws.getColumn(csCol).numFmt = "yyyy-mm-dd";
    ws.getColumn(ceCol).numFmt = "yyyy-mm-dd";
    ws.views = [{ state: "frozen", ySplit: 1 }];

    const outPath = path.join(outDir, cycle.file);
    await wb.xlsx.writeFile(outPath);
    const avgDef = (rows.reduce((s, r) => s + (r["Defects"] as number), 0) / rows.length).toFixed(1);
    const interns = rows.filter((r) => r["Role"] === "Intern").length;
    console.log(`  ✓ ${cycle.label}: ${cycle.file}  (rows=${rows.length}, interns=${interns}, avg defects=${avgDef})`);
  }

  console.log("\nUpload order: Feb → Mar → Apr → May (as the Software Engineering dept head).");
}

main().finally(() => process.exit(0));
