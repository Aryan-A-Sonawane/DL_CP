/**
 * Generates a test Excel cycle report from public/users.json
 * Usage: node scripts/generate-test-sheet.mjs
 */
import ExcelJS from "exceljs";
import { readFileSync } from "fs";
import { randomInt } from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const users     = JSON.parse(readFileSync(path.join(__dirname, "../public/users.json"), "utf8"));

// ── Config ────────────────────────────────────────────────────────────────────
const ORG_NAME  = "Passion Infotech";
const DEPT_NAME = "Software Engineering";
const PROJECT   = "Customer Portal v2";
const LIFECYCLE = "Scrum";
const PHASE     = "Sprint Execution";

const LIFECYCLES = ["Scrum", "Kanban", "SAFe", "Waterfall", "XP"];
const PHASES     = ["Sprint Execution", "Planning", "Integration & Testing", "Analysis", "Deployment", "UAT"];
const PROJECTS   = ["Customer Portal v2", "Inventory Management", "Data Pipeline", "Mobile App", "CRM Integration"];

const pick  = (arr) => arr[randomInt(0, arr.length)];
const rnd   = (lo, hi) => Math.round((Math.random() * (hi - lo) + lo) * 10) / 10;
const rndI  = (lo, hi) => randomInt(lo, hi + 1);

// Performance profiles keyed on softSkillScore ranges
function profile(softSkill) {
  if (softSkill >= 8)   return { hoursRatio: [0.88, 1.00], defects: [0, 3],  fixMult: [0.5, 1.5],  onTime: 0.95 };
  if (softSkill >= 6.5) return { hoursRatio: [0.72, 0.92], defects: [3, 8],  fixMult: [1.5, 3.5],  onTime: 0.80 };
  return                       { hoursRatio: [0.55, 0.78], defects: [6, 15], fixMult: [3.0, 7.0],  onTime: 0.60 };
}

// ── Filter to employees only, all 21 in the department ───────────────────────
const employees = users.filter(u => u.role === "EMPLOYEE" && u.departmentId === 1);

console.log(`Building sheet for ${employees.length} employees…`);

// Build rows — one realistic row per employee per this cycle
const rows = employees.map(emp => {
  const p             = profile(emp.softSkillScore);
  const hoursPerCycle = pick([80, 120, 160]);
  const hoursWorked   = rnd(p.hoursRatio[0] * hoursPerCycle, p.hoursRatio[1] * hoursPerCycle);
  const defects       = rndI(...p.defects);
  const fixHours      = defects > 0 ? rnd(p.fixMult[0] * defects, p.fixMult[1] * defects) : 0;
  const cycles        = rndI(1, 3);
  const onTime        = Math.random() < p.onTime ? "Yes" : "No";

  return {
    "emp name":               emp.name,
    "emp id":                 emp.empCode ?? `EMP${String(emp.id).padStart(4, "0")}`,
    "email":                  emp.email,
    "project":                pick(PROJECTS),
    "organization":           ORG_NAME,
    "department":             DEPT_NAME,
    "productivity cycles":    cycles,
    "hours per cycle":        hoursPerCycle,
    "hours worked":           hoursWorked,
    "defects":                defects,
    "defect fix time hours":  fixHours,
    "lifecycle":              pick(LIFECYCLES),
    "phase":                  pick(PHASES),
    "on time submission":     onTime,
  };
});

// ── Build workbook ────────────────────────────────────────────────────────────
const wb = new ExcelJS.Workbook();
wb.creator = "DL_CP Platform";
wb.created = new Date();

const ws = wb.addWorksheet("Cycle Report");
const headers = Object.keys(rows[0]);

// Header row
ws.addRow(headers);
const hRow = ws.getRow(1);
hRow.font      = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
hRow.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
hRow.alignment = { horizontal: "center", vertical: "middle" };
hRow.height    = 22;

// Column widths
ws.getColumn(1).width  = 22;  // emp name
ws.getColumn(2).width  = 12;  // emp id
ws.getColumn(3).width  = 28;  // email
ws.getColumn(4).width  = 24;  // project
ws.getColumn(5).width  = 20;  // organization
ws.getColumn(6).width  = 22;  // department
ws.getColumn(7).width  = 20;  // productivity cycles
ws.getColumn(8).width  = 16;  // hours per cycle
ws.getColumn(9).width  = 14;  // hours worked
ws.getColumn(10).width = 10;  // defects
ws.getColumn(11).width = 22;  // defect fix time hours
ws.getColumn(12).width = 14;  // lifecycle
ws.getColumn(13).width = 24;  // phase
ws.getColumn(14).width = 18;  // on time submission

// Data rows with alternating fills
rows.forEach((r, i) => {
  const dr = ws.addRow(Object.values(r));
  dr.fill = {
    type: "pattern", pattern: "solid",
    fgColor: { argb: i % 2 === 0 ? "FFF5F3FF" : "FFFFFFFF" },
  };
  dr.alignment = { vertical: "middle" };
  dr.height = 18;
});

// Freeze header
ws.views = [{ state: "frozen", ySplit: 1 }];

// Auto-filter on header row
ws.autoFilter = { from: "A1", to: `${String.fromCharCode(64 + headers.length)}1` };

// Save
const date    = new Date().toISOString().split("T")[0];
const outName = `test-cycle-${date}.xlsx`;
const outPath = path.join(__dirname, "../public/excel_reports", outName);
await wb.xlsx.writeFile(outPath);

console.log(`\nDone! ${rows.length} rows written.`);
console.log(`File: public/excel_reports/${outName}`);
console.log("\nEmployees included:");
employees.forEach(e => console.log(`  ${(e.empCode ?? "no-code").padEnd(8)}  ${e.name}`));
