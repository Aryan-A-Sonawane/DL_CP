/**
 * generate-multi-cycle-sheets.mjs
 *
 * Creates 3 realistic Excel cycle reports for the SAME 20 employees (dept 1)
 * across consecutive monthly cycles, with a deliberate improvement arc:
 *
 *   Cycle 1 (Feb 2026)  — Baseline: rough cycle, high defects, late submissions
 *   Cycle 2 (Mar 2026)  — Mid-recovery: meaningful improvement visible
 *   Cycle 3 (Apr 2026)  — Stabilisation: strong performers shine, stragglers catch up
 *
 * This gives the graphs 3 data points per employee so trend lines,
 * Six Sigma process control charts, and resilience trajectories all light up.
 *
 * Usage:  node scripts/generate-multi-cycle-sheets.mjs
 */

import ExcelJS from "exceljs";
import { readFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const users     = JSON.parse(readFileSync(path.join(__dirname, "../public/users.json"), "utf8"));

// ── Constants ─────────────────────────────────────────────────────────────────
const ORG_NAME  = "Passion Infotech";
const DEPT_NAME = "Software Engineering";

const PROJECTS   = [
  "Customer Portal v2",
  "Inventory Management System",
  "Data Pipeline Overhaul",
  "Mobile Banking App",
  "CRM Integration Suite",
];

const LIFECYCLES = ["Scrum", "Kanban", "SAFe", "XP", "Waterfall"];
const PHASES     = [
  "Sprint Execution", "Sprint Planning", "Sprint Review",
  "Integration & Testing", "Analysis", "Deployment", "UAT", "Backlog Refinement",
];

// Seeded PRNG so sheets are reproducible (not random on every run)
let _seed = 7331;
function rand()       { _seed = (_seed * 1664525 + 1013904223) >>> 0; return _seed / 0xffffffff; }
function rndI(lo, hi) { return lo + Math.floor(rand() * (hi - lo + 1)); }
function rndF(lo, hi, dp = 1) { return parseFloat((lo + rand() * (hi - lo)).toFixed(dp)); }
function pick(arr)    { return arr[Math.floor(rand() * arr.length)]; }

// ── Employee data (dept 1 employees from users.json) ──────────────────────────
const employees = users.filter(u => u.role === "EMPLOYEE" && u.departmentId === 1);
console.log(`Found ${employees.length} employees in dept 1.`);

/**
 * Performance profile per cycle.
 * cycleIndex 0 = Feb (rough), 1 = Mar (improving), 2 = Apr (stable/good)
 *
 * Each employee has a base profile from their softSkillScore.
 * On top of that, cycleIndex nudges values toward improvement.
 *
 * Improvement story:
 *   - High performers (softSkill >= 8): already good, small incremental gains
 *   - Mid performers (6.5–7.9): dramatic improvement from cycle 1 → 3
 *   - Lower performers (< 6.5): slow climb, some still struggling in cycle 2
 */
function buildRow(emp, cycleIndex) {
  const ss = emp.softSkillScore ?? 6;

  // Improvement multiplier per cycle (0=worst, 2=best)
  // Each employee type has a different improvement slope
  const improveMult = (() => {
    if (ss >= 8)   return [1.00, 1.03, 1.06][cycleIndex]; // already strong, small gains
    if (ss >= 7)   return [0.80, 0.90, 1.00][cycleIndex]; // clear improvement arc
    if (ss >= 6.5) return [0.70, 0.83, 0.95][cycleIndex]; // catching up
    return               [0.58, 0.70, 0.82][cycleIndex]; // struggling, slow climb
  })();

  // --- Hours ---
  const hoursPerCycle = pick([80, 120, 160]);
  // Higher improveMult = more of allocated hours actually worked (efficiency)
  const hoursWorked = rndF(
    hoursPerCycle * improveMult * 0.88,
    hoursPerCycle * improveMult * 1.00,
  );

  // --- Defects ---
  // Base defects inversely tied to skill; improvement reduces them each cycle
  const baseDefects = ss >= 8
    ? rndI(0, 4)
    : ss >= 7
      ? rndI(3, 10)
      : ss >= 6.5
        ? rndI(6, 16)
        : rndI(10, 22);

  // Apply improvement reduction: cycle 0 full, cycle 2 reduced by up to 50%
  const defectReduction = [1.0, 0.70, 0.48][cycleIndex];
  const defects = Math.max(0, Math.round(baseDefects * defectReduction));

  // --- Defect fix time ---
  // High-skill fix faster; improvement also speeds up fix time
  const fixTimePerDefect = ss >= 8
    ? rndF(0.8, 2.0)
    : ss >= 7
      ? rndF(2.0, 4.5)
      : ss >= 6.5
        ? rndF(4.0, 7.5)
        : rndF(6.0, 12.0);
  const fixTimeReduction = [1.0, 0.78, 0.60][cycleIndex];
  const defectFixHours = defects > 0
    ? rndF(defects * fixTimePerDefect * fixTimeReduction * 0.7, defects * fixTimePerDefect * fixTimeReduction)
    : 0;

  // --- On-time submission ---
  // Lower skill = more late; improves per cycle
  const onTimeProb = ss >= 8
    ? [0.95, 0.97, 0.99][cycleIndex]
    : ss >= 7
      ? [0.75, 0.85, 0.93][cycleIndex]
      : ss >= 6.5
        ? [0.60, 0.72, 0.85][cycleIndex]
        : [0.45, 0.58, 0.72][cycleIndex];

  const onTime = rand() < onTimeProb ? "Yes" : "No";

  // --- Project, lifecycle, phase ---
  // Assign same project for first 2 cycles (in-flight), may switch on cycle 3
  const project = cycleIndex < 2
    ? PROJECTS[employees.indexOf(emp) % PROJECTS.length]
    : pick(PROJECTS);

  const lifecycle = pick(LIFECYCLES);
  const phase     = pick(PHASES);
  const cycles    = rndI(1, 3);

  return {
    "emp name":              emp.name,
    "emp id":                emp.empCode ?? `EMP${String(emp.id).padStart(4, "0")}`,
    "email":                 emp.email,
    "project":               project,
    "organization":          ORG_NAME,
    "department":            DEPT_NAME,
    "productivity cycles":   cycles,
    "hours per cycle":       hoursPerCycle,
    "hours worked":          parseFloat(hoursWorked.toFixed(1)),
    "defects":               defects,
    "defect fix time hours": parseFloat(defectFixHours.toFixed(1)),
    "lifecycle":             lifecycle,
    "phase":                 phase,
    "on time submission":    onTime,
  };
}

// ── Cycle configs ─────────────────────────────────────────────────────────────
const CYCLES = [
  { label: "Cycle 1 — Feb 2026 (Baseline)",  filename: "test-cycle-2026-02-28.xlsx", cycleIndex: 0 },
  { label: "Cycle 2 — Mar 2026 (Recovery)",  filename: "test-cycle-2026-03-31.xlsx", cycleIndex: 1 },
  { label: "Cycle 3 — Apr 2026 (Progress)",  filename: "test-cycle-2026-04-30.xlsx", cycleIndex: 2 },
];

// ── Excel writer ──────────────────────────────────────────────────────────────
async function writeSheet(cycleConfig) {
  const { label, filename, cycleIndex } = cycleConfig;

  // Reset seed per cycle so each is deterministic but different
  _seed = 7331 + cycleIndex * 1337;

  const rows = employees.map(emp => buildRow(emp, cycleIndex));

  const wb = new ExcelJS.Workbook();
  wb.creator  = "DL_CP Platform";
  wb.created  = new Date();

  const ws = wb.addWorksheet("Cycle Report");

  const headers = Object.keys(rows[0]);

  // Title row (merged)
  ws.mergeCells(`A1:${String.fromCharCode(64 + headers.length)}1`);
  const titleCell = ws.getCell("A1");
  titleCell.value     = label;
  titleCell.font      = { bold: true, color: { argb: "FFFFFFFF" }, size: 13 };
  titleCell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF312E81" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 26;

  // Header row
  ws.addRow(headers);
  const hRow = ws.getRow(2);
  hRow.font      = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
  hRow.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
  hRow.alignment = { horizontal: "center", vertical: "middle" };
  hRow.height    = 20;

  // Column widths
  const widths = [22, 12, 28, 24, 20, 22, 20, 16, 14, 10, 22, 14, 24, 18];
  widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  // Data rows
  rows.forEach((r, i) => {
    const dr = ws.addRow(Object.values(r));

    // Colour-code by on-time: green tint for Yes, light red for No
    const onTime = r["on time submission"] === "Yes";
    dr.fill = {
      type: "pattern", pattern: "solid",
      fgColor: { argb: i % 2 === 0
        ? (onTime ? "FFECFDF5" : "FFFFF1F2")
        : (onTime ? "FFF5FDF9" : "FFFFF8F8") },
    };
    dr.alignment = { vertical: "middle" };
    dr.height = 18;

    // Highlight defects column (col 10) in amber if high
    const defectsCell = dr.getCell(10);
    const defVal = r["defects"];
    if (defVal >= 10) {
      defectsCell.font = { bold: true, color: { argb: "FFB45309" } };
    } else if (defVal >= 5) {
      defectsCell.font = { color: { argb: "FFD97706" } };
    } else {
      defectsCell.font = { color: { argb: "FF059669" } };
    }
  });

  // Freeze rows 1 & 2
  ws.views = [{ state: "frozen", ySplit: 2 }];
  ws.autoFilter = { from: "A2", to: `${String.fromCharCode(64 + headers.length)}2` };

  // Summary stats below data
  const summaryStartRow = rows.length + 4;
  const statsData = [
    ["CYCLE SUMMARY",            ""],
    ["Total employees",          rows.length],
    ["Avg defects",              (rows.reduce((s, r) => s + r["defects"], 0) / rows.length).toFixed(2)],
    ["Avg hours worked",         (rows.reduce((s, r) => s + r["hours worked"], 0) / rows.length).toFixed(1)],
    ["On-time %",                ((rows.filter(r => r["on time submission"] === "Yes").length / rows.length) * 100).toFixed(1) + "%"],
    ["Avg fix time / defect (h)", (() => {
      const withDefects = rows.filter(r => r["defects"] > 0);
      if (!withDefects.length) return "N/A";
      return (withDefects.reduce((s, r) => s + r["defect fix time hours"] / r["defects"], 0) / withDefects.length).toFixed(2);
    })()],
  ];
  statsData.forEach(([k, v], idx) => {
    const rowIdx = summaryStartRow + idx;
    const kr = ws.getCell(`A${rowIdx}`);
    const vr = ws.getCell(`B${rowIdx}`);
    kr.value = k;
    vr.value = v;
    if (idx === 0) {
      kr.font = { bold: true, color: { argb: "FFFFFFFF" } };
      kr.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
      vr.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
    } else {
      kr.font = { bold: true, color: { argb: "FF374151" } };
      kr.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F3FF" } };
      vr.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF2FF" } };
    }
    ws.getRow(rowIdx).height = 18;
  });

  const outDir  = path.join(__dirname, "../public/excel_reports");
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, filename);
  await wb.xlsx.writeFile(outPath);

  // Print summary
  const avgDefects = (rows.reduce((s, r) => s + r["defects"], 0) / rows.length).toFixed(2);
  const onTimePct  = ((rows.filter(r => r["on time submission"] === "Yes").length / rows.length) * 100).toFixed(0);
  console.log(`\n✅  ${label}`);
  console.log(`   File: public/excel_reports/${filename}`);
  console.log(`   Employees: ${rows.length} | Avg defects: ${avgDefects} | On-time: ${onTimePct}%`);
}

// ── Run all cycles ────────────────────────────────────────────────────────────
console.log("Generating 3-cycle improvement arc sheets…\n");
for (const cycle of CYCLES) {
  await writeSheet(cycle);
}

console.log("\n🎯  All 3 sheets generated.");
console.log("   Upload them via dept head in order (Feb → Mar → Apr) to show");
console.log("   the improvement arc in Six Sigma and trend charts.\n");
