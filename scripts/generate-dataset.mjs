/**
 * generate-dataset.mjs
 * Generates a realistic 2000+ row Excel dataset for the Failure Intelligence Mapper.
 * Run: node scripts/generate-dataset.mjs
 *
 * Columns produced (matching HEADER_ALIASES in lib/excel.ts):
 *   emp_id, emp_name, email, project, organization,
 *   productivity_cycles, hours_per_cycle, hours_worked,
 *   defects, defect_fix_time_hours,
 *   lifecycle, phase, department
 */

import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "public", "excel_reports", "software-engineering-cycle-2026-04-25.xlsx");

// ─── Reference data ──────────────────────────────────────────────────────────

const ORGANIZATION = "Passion Infotech Pvt Ltd";

const DEPARTMENTS = [
  "Software Engineering",
  "Data & Analytics",
  "DevOps & Infrastructure",
  "Product Management",
  "QA & Testing",
  "UI/UX Design",
  "Mobile Development",
  "Cloud Architecture",
];

const DEPT_PROJECTS = {
  "Software Engineering":      ["Phoenix CRM", "Nexus ERP", "Atlas API Gateway", "Hercules Microservices", "Titan Backend Platform"],
  "Data & Analytics":          ["DataLake Rebuild", "BI Dashboard v3", "ML Pipeline Alpha", "Real-time Analytics Hub", "Customer 360 Platform"],
  "DevOps & Infrastructure":   ["CI/CD Overhaul", "K8s Migration", "Observability Stack", "Disaster Recovery v2", "Infrastructure as Code"],
  "Product Management":        ["Roadmap Intelligence", "OKR Tracker", "Market Fit Analyzer", "Feature Prioritization Engine", "Stakeholder Portal"],
  "QA & Testing":              ["Automation Framework", "Performance Benchmarking", "Security Pen-test Suite", "Regression Test Lab", "API Contract Tests"],
  "UI/UX Design":              ["Design System 2.0", "Mobile UX Revamp", "Accessibility Audit", "User Research Portal", "Component Library"],
  "Mobile Development":        ["iOS Banking App", "Android Retail App", "Cross-Platform SDK", "Push Notification Engine", "Offline-First Client"],
  "Cloud Architecture":        ["Multi-Cloud Strategy", "Cost Optimization Suite", "Serverless Migration", "Edge Computing PoC", "Cloud Security Posture"],
};

const LIFECYCLES = ["Waterfall", "Scrum", "Kanban", "SAFe", "XP", "DSDM", "Crystal Clear", "Spiral"];

// Lifecycle → valid phases mapping
const LIFECYCLE_PHASES = {
  Waterfall:      ["Requirements Analysis", "System Design", "Implementation", "Integration & Testing", "Deployment", "Maintenance"],
  Scrum:          ["Sprint Planning", "Sprint Execution", "Sprint Review", "Sprint Retrospective", "Backlog Refinement", "Release"],
  Kanban:         ["Backlog", "In Analysis", "In Development", "In Review", "In Testing", "Done"],
  SAFe:           ["PI Planning", "Iteration Execution", "System Demo", "Inspect & Adapt", "Solution Train Sync", "Release"],
  XP:             ["Exploration", "Planning", "Iterations to Release", "Productionizing", "Maintenance"],
  DSDM:           ["Feasibility Study", "Business Study", "Functional Model Iteration", "Design & Build Iteration", "Implementation"],
  "Crystal Clear": ["Chartering", "Delivery Cycles", "Wrap-Up"],
  Spiral:         ["Objectives & Constraints", "Risk Analysis", "Development & Testing", "Planning for Next Cycle"],
};

const FIRST_NAMES = [
  "Aryan","Priya","Rahul","Sneha","Vikram","Ananya","Rohan","Kavita","Amit","Deepa",
  "Suresh","Meera","Kiran","Pooja","Aditya","Nisha","Siddharth","Riya","Harish","Divya",
  "Nikhil","Anjali","Varun","Preeti","Gaurav","Swati","Manish","Sunita","Rajesh","Lata",
  "Tarun","Shweta","Ajay","Geeta","Vijay","Archana","Sandeep","Pallavi","Mukesh","Rekha",
  "Abhishek","Smita","Nilesh","Jyoti","Sachin","Rupali","Dinesh","Aparna","Kaustubh","Vrinda",
  "Yash","Riddhi","Tejas","Sayali","Omkar","Madhuri","Saurabh","Supriya","Akash","Rasika",
  "Prathamesh","Vaishnavi","Rushikesh","Shraddha","Aaditya","Simran","Parth","Radhika","Himanshu","Bhavna",
  "Chirag","Monali","Deven","Tejal","Ketaki","Nandkumar","Sudha","Bhushan","Chetna","Vinay",
];

const LAST_NAMES = [
  "Sonawane","Patil","Sharma","Desai","Joshi","Nair","Rao","Singh","Mehta","Shah",
  "Kulkarni","Gupta","Verma","Pandey","Mishra","Kumar","Chavan","Sawant","More","Kadam",
  "Jadhav","Shinde","Bhosale","Gaikwad","Mane","Pawar","Thorat","Deshpande","Bhat","Naik",
  "Iyer","Pillai","Menon","Thomas","Varghese","Anand","Reddy","Yadav","Tiwari","Bose",
  "Banerjee","Chatterjee","Mukherjee","Roy","Das","Ghosh","Sen","Dutta","Saha","Paul",
];

// ─── Seeded PRNG for reproducibility ─────────────────────────────────────────
let _seed = 42;
function rand() {
  _seed = (_seed * 1664525 + 1013904223) >>> 0;
  return _seed / 0xffffffff;
}
function randInt(lo, hi) { return lo + Math.floor(rand() * (hi - lo + 1)); }
function randFloat(lo, hi, decimals = 1) {
  return parseFloat((lo + rand() * (hi - lo)).toFixed(decimals));
}
function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }

// ─── Employee pool (200 unique employees across departments) ──────────────────
function generateEmployees(count = 200) {
  const employees = [];
  const usedCodes = new Set();
  const usedEmails = new Set();

  for (let i = 0; i < count; i++) {
    let code;
    do { code = `EMP${String(randInt(1000, 9999)).padStart(4, "0")}`; }
    while (usedCodes.has(code));
    usedCodes.add(code);

    const firstName = pick(FIRST_NAMES);
    const lastName  = pick(LAST_NAMES);
    const name = `${firstName} ${lastName}`;

    let email;
    let suffix = 0;
    do {
      const tag = suffix === 0 ? "" : suffix;
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${tag}@passioninfotech.com`;
      suffix++;
    } while (usedEmails.has(email));
    usedEmails.add(email);

    const dept = DEPARTMENTS[i % DEPARTMENTS.length];

    employees.push({ code, name, email, dept });
  }
  return employees;
}

// ─── Per-lifecycle performance profile weights ────────────────────────────────
// These drive realistic variance: Scrum teams tend to have more frequent but
// smaller defects; Waterfall has longer cycles with bigger batch defects, etc.

const LIFECYCLE_PROFILE = {
  Waterfall:      { cyclesMin: 1, cyclesMax: 2, hpcMin: 160, hpcMax: 240, defectBase: 15, defectRange: 20, fixTimeBase: 8,  efficiency: 0.75 },
  Scrum:          { cyclesMin: 4, cyclesMax: 8, hpcMin: 40,  hpcMax: 80,  defectBase: 3,  defectRange: 6,  fixTimeBase: 2,  efficiency: 0.90 },
  Kanban:         { cyclesMin: 3, cyclesMax: 6, hpcMin: 40,  hpcMax: 80,  defectBase: 4,  defectRange: 8,  fixTimeBase: 3,  efficiency: 0.88 },
  SAFe:           { cyclesMin: 4, cyclesMax: 6, hpcMin: 80,  hpcMax: 120, defectBase: 6,  defectRange: 10, fixTimeBase: 4,  efficiency: 0.87 },
  XP:             { cyclesMin: 4, cyclesMax: 8, hpcMin: 40,  hpcMax: 80,  defectBase: 2,  defectRange: 5,  fixTimeBase: 2,  efficiency: 0.92 },
  DSDM:           { cyclesMin: 2, cyclesMax: 4, hpcMin: 80,  hpcMax: 160, defectBase: 8,  defectRange: 12, fixTimeBase: 5,  efficiency: 0.85 },
  "Crystal Clear":{ cyclesMin: 2, cyclesMax: 4, hpcMin: 80,  hpcMax: 160, defectBase: 5,  defectRange: 8,  fixTimeBase: 3,  efficiency: 0.88 },
  Spiral:         { cyclesMin: 2, cyclesMax: 3, hpcMin: 120, hpcMax: 200, defectBase: 10, defectRange: 16, fixTimeBase: 6,  efficiency: 0.82 },
};

// ─── Phase affects quality: late phases have more defect-fix pressure ─────────
const PHASE_DEFECT_MULTIPLIERS = {
  // Waterfall
  "Requirements Analysis": 0.3, "System Design": 0.5, "Implementation": 1.0,
  "Integration & Testing": 1.4, "Deployment": 0.8, "Maintenance": 0.6,
  // Scrum
  "Sprint Planning": 0.2, "Sprint Execution": 1.0, "Sprint Review": 0.5,
  "Sprint Retrospective": 0.2, "Backlog Refinement": 0.3, "Release": 0.9,
  // Kanban
  "Backlog": 0.2, "In Analysis": 0.4, "In Development": 1.0,
  "In Review": 0.6, "In Testing": 1.2, "Done": 0.3,
  // SAFe
  "PI Planning": 0.2, "Iteration Execution": 1.0, "System Demo": 0.5,
  "Inspect & Adapt": 0.3, "Solution Train Sync": 0.4,
  // XP
  "Exploration": 0.3, "Planning": 0.2, "Iterations to Release": 1.0,
  "Productionizing": 0.8,
  // DSDM
  "Feasibility Study": 0.2, "Business Study": 0.3,
  "Functional Model Iteration": 0.9, "Design & Build Iteration": 1.1,
  // Crystal Clear
  "Chartering": 0.2, "Delivery Cycles": 1.0, "Wrap-Up": 0.5,
  // Spiral
  "Objectives & Constraints": 0.2, "Risk Analysis": 0.5,
  "Development & Testing": 1.1, "Planning for Next Cycle": 0.3,
};

// ─── Department affects role/skill affinity (employee performance archetype) ──
const DEPT_EFFICIENCY = {
  "Software Engineering":    0.88,
  "Data & Analytics":        0.85,
  "DevOps & Infrastructure": 0.92,
  "Product Management":      0.80,
  "QA & Testing":            0.87,
  "UI/UX Design":            0.83,
  "Mobile Development":      0.89,
  "Cloud Architecture":      0.91,
};

// ─── Main generation ──────────────────────────────────────────────────────────

function generateRows(employees, targetRows = 2100) {
  const rows = [];
  let empIdx = 0;

  while (rows.length < targetRows) {
    const emp = employees[empIdx % employees.length];
    empIdx++;

    // Pick a random lifecycle (biased toward Scrum/SAFe for software teams)
    const lifecycleBias = emp.dept === "Software Engineering" || emp.dept === "Mobile Development"
      ? ["Scrum", "Scrum", "SAFe", "XP", "Kanban", "Waterfall"]
      : emp.dept === "DevOps & Infrastructure" || emp.dept === "Cloud Architecture"
        ? ["Kanban", "Kanban", "Scrum", "SAFe", "DevOps & Infrastructure", "XP"]
        : emp.dept === "QA & Testing"
          ? ["Scrum", "Kanban", "Waterfall", "SAFe", "XP", "Scrum"]
          : LIFECYCLES;

    const lifecycle = pick(lifecycleBias.filter(l => LIFECYCLE_PHASES[l]));
    const phase = pick(LIFECYCLE_PHASES[lifecycle]);
    const profile = LIFECYCLE_PROFILE[lifecycle];
    const phaseMult = PHASE_DEFECT_MULTIPLIERS[phase] ?? 1.0;
    const deptEff = DEPT_EFFICIENCY[emp.dept] ?? 0.87;

    // Core performance metrics
    const productivityCycles = randInt(profile.cyclesMin, profile.cyclesMax);
    const hoursPerCycle = randInt(profile.hpcMin, profile.hpcMax);
    const expectedHours = productivityCycles * hoursPerCycle;

    // Employee performance archetype: 60% high-performer, 30% average, 10% low
    const archetype = rand() < 0.60 ? "high" : rand() < 0.75 ? "avg" : "low";
    const efficiencyMult = archetype === "high"
      ? randFloat(0.95, 1.05, 3)
      : archetype === "avg"
        ? randFloat(0.78, 0.94, 3)
        : randFloat(0.55, 0.77, 3);

    const hoursWorked = parseFloat((expectedHours * efficiencyMult * deptEff * profile.efficiency).toFixed(1));

    // Defects: high performers have fewer; multiply by phase and archetype
    const baseDefects = profile.defectBase + randInt(0, profile.defectRange);
    const archetypeDefectMult = archetype === "high" ? 0.4 : archetype === "avg" ? 0.85 : 1.5;
    const defects = Math.max(0, Math.round(baseDefects * phaseMult * archetypeDefectMult));

    // Defect fix time: proportional to severity & archetype speed
    let defectFixHours = 0;
    if (defects > 0) {
      const baseFixPerDefect = profile.fixTimeBase + randFloat(0, 2.0, 2);
      const fixSpeedMult = archetype === "high" ? 0.6 : archetype === "avg" ? 0.9 : 1.4;
      defectFixHours = parseFloat((defects * baseFixPerDefect * fixSpeedMult).toFixed(1));
    }

    const project = pick(DEPT_PROJECTS[emp.dept] ?? ["General Project"]);

    rows.push({
      emp_id:                   emp.code,
      emp_name:                 emp.name,
      email:                    emp.email,
      project,
      organization:             ORGANIZATION,
      productivity_cycles:      productivityCycles,
      hours_per_cycle:          hoursPerCycle,
      hours_worked:             hoursWorked,
      defects,
      defect_fix_time_hours:    defectFixHours,
      lifecycle,
      phase,
      department:               emp.dept,
    });
  }

  return rows;
}

// ─── Write Excel ──────────────────────────────────────────────────────────────

async function writeExcel(rows) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Passion Infotech Dataset Generator";
  wb.created = new Date();

  const ws = wb.addWorksheet("Performance Data");

  ws.columns = [
    { header: "emp id",                    key: "emp_id",                 width: 14 },
    { header: "emp name",                  key: "emp_name",               width: 22 },
    { header: "email",                     key: "email",                  width: 38 },
    { header: "project",                   key: "project",                width: 28 },
    { header: "organization",              key: "organization",           width: 28 },
    { header: "productivity cycles",       key: "productivity_cycles",    width: 20 },
    { header: "hours per cycle",           key: "hours_per_cycle",        width: 16 },
    { header: "hours worked",              key: "hours_worked",           width: 14 },
    { header: "defects",                   key: "defects",                width: 10 },
    { header: "defect fix time hours",     key: "defect_fix_time_hours",  width: 22 },
    { header: "lifecycle",                 key: "lifecycle",              width: 16 },
    { header: "phase",                     key: "phase",                  width: 28 },
    { header: "department",               key: "department",             width: 26 },
  ];

  // Style header row
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 22;
  ws.views = [{ state: "frozen", ySplit: 1 }];

  // Alternate row colours
  rows.forEach((row, i) => {
    const r = ws.addRow(row);
    if (i % 2 === 0) {
      r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F3FF" } };
    }
  });

  // Auto-filter
  ws.autoFilter = { from: "A1", to: `M1` };

  await wb.xlsx.writeFile(OUT);
  console.log(`✅  Wrote ${rows.length} rows → ${OUT}`);
}

// ─── Run ──────────────────────────────────────────────────────────────────────
const employees = generateEmployees(200);
const rows = generateRows(employees, 2100);
await writeExcel(rows);

// Quick stats
const byDept = {};
const byLifecycle = {};
rows.forEach(r => {
  byDept[r.department] = (byDept[r.department] ?? 0) + 1;
  byLifecycle[r.lifecycle] = (byLifecycle[r.lifecycle] ?? 0) + 1;
});
console.log("\n📊 Row distribution by Department:");
Object.entries(byDept).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`   ${k.padEnd(30)} ${v}`));
console.log("\n📊 Row distribution by Lifecycle:");
Object.entries(byLifecycle).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`   ${k.padEnd(20)} ${v}`));
