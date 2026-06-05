import ExcelJS from "exceljs";

/** Employment type carried by each report row. Stored on the User. */
export type EmploymentType = "employee" | "intern";

export interface ParsedRow {
  empCode: string;
  name: string;
  email: string;
  /** Employment type — strictly "employee" or "intern". */
  role: EmploymentType;
  project: string;
  organization?: string;
  productivityCycles: number;
  hoursPerCycle: number;
  hoursWorked: number;
  defects: number;
  defectFixHours: number;
  /** Software lifecycle methodology (e.g. Scrum, Waterfall, SAFe) */
  lifecycle?: string;
  /** Lifecycle phase at time of record (e.g. Sprint Execution, Integration & Testing) */
  phase?: string;
  /** Department name from the sheet (informational; org-scoped queries use DB dept) */
  department?: string;
  /** Optional explicit cycle window from the sheet. When present on a report,
   *  the upload stamps records with this period instead of the current cycle —
   *  this is what lets you upload back-dated monthly reports (Feb, Mar, …). */
  cycleStart?: Date;
  cycleEnd?: Date;
}

export interface ParseResult {
  rows: ParsedRow[];
  errors: { row: number; message: string }[];
}

const HEADER_ALIASES: Record<keyof ParsedRow, string[]> = {
  empCode: ["emp id", "empid", "employee id", "id", "emp_code", "emp code"],
  name: ["emp name", "name", "employee name", "full name"],
  email: ["email", "email id", "e-mail"],
  // ── Employment type (employee | intern) ─────────────────────────────────────
  role: ["role", "employment type", "employee type", "emp type", "staff type"],
  project: ["project", "project name"],
  organization: ["organization", "org", "company"],
  productivityCycles: ["productivity cycles", "cycles", "no of cycles"],
  hoursPerCycle: ["hours per cycle", "hrs per cycle", "cycle hours"],
  hoursWorked: ["hours worked", "worked hours", "actual hours"],
  defects: ["defects", "no of defects", "number of defects", "defect count"],
  defectFixHours: [
    "defect fix hours",
    "defect fix time hours",
    "time to fix defects",
    "fix time",
    "defect fix time",
    "time required to fix defects",
    "time required to fix those defects",
  ],
  // ── New enrichment columns (optional) ──────────────────────────────────────
  lifecycle:  ["lifecycle", "life cycle", "methodology", "sdlc"],
  phase:      ["phase", "sprint phase", "cycle phase", "project phase"],
  department: ["department", "dept", "team", "division"],
  cycleStart: ["cycle start", "cycle start date", "period start", "from date", "cycle from"],
  cycleEnd:   ["cycle end", "cycle end date", "period end", "to date", "cycle month", "cycle to"],
};

const REQUIRED: (keyof ParsedRow)[] = [
  "empCode",
  "name",
  "email",
  "role",
  "hoursWorked",
  "defects",
  "defectFixHours",
];

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ");
}

function buildHeaderMap(headerRow: string[]): Partial<Record<keyof ParsedRow, number>> {
  const map: Partial<Record<keyof ParsedRow, number>> = {};
  const normalized = headerRow.map((h) => normalize(String(h ?? "")));
  for (const key of Object.keys(HEADER_ALIASES) as (keyof ParsedRow)[]) {
    const aliases = HEADER_ALIASES[key].map(normalize);
    const idx = normalized.findIndex((h) => aliases.includes(h));
    if (idx >= 0) map[key] = idx;
  }
  return map;
}

function num(v: unknown, fallback = 0): number {
  if (v === null || v === undefined || v === "") return fallback;
  const n = typeof v === "number" ? v : Number(String(v).trim());
  return Number.isFinite(n) ? n : fallback;
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object" && v !== null && "text" in (v as Record<string, unknown>)) {
    return String((v as { text: unknown }).text ?? "");
  }
  return String(v).trim();
}

/** Parse a cell into a Date, or undefined when it isn't a usable date. */
function dateVal(v: unknown): Date | undefined {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? undefined : v;
  const s = str(v);
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** Map a raw cell value to a strict EmploymentType, or null if it's not valid. */
function parseRole(v: string): EmploymentType | null {
  const n = normalize(v);
  if (["employee", "employees", "fte", "full time", "permanent", "regular"].includes(n)) {
    return "employee";
  }
  if (["intern", "interns", "internship", "trainee"].includes(n)) {
    return "intern";
  }
  return null;
}

function readRowCells(ws: ExcelJS.Worksheet, rowNumber: number): unknown[] {
  const cells: unknown[] = [];
  ws.getRow(rowNumber).eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cells[colNumber - 1] = cell.value;
  });
  return cells;
}

export async function parseExcelBuffer(buf: ArrayBuffer | Buffer): Promise<ParseResult> {
  const wb = new ExcelJS.Workbook();
  // exceljs expects a Buffer with the modern shape — re-wrap to be safe across runtimes.
  const ab =
    buf instanceof ArrayBuffer
      ? buf
      : buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  await wb.xlsx.load(ab as ArrayBuffer);
  const ws = wb.worksheets[0];
  if (!ws) return { rows: [], errors: [{ row: 0, message: "Workbook has no sheets" }] };

  const rows: ParsedRow[] = [];
  const errors: { row: number; message: string }[] = [];

  // ── Locate the header row ───────────────────────────────────────────────────
  // Some exports put a merged title banner (e.g. "Cycle 1 — Feb 2026") on row 1
  // and the real headers on row 2+. Scan the first rows and pick the one that
  // resolves the most known columns instead of blindly assuming row 1.
  const scanLimit = Math.min(10, ws.rowCount || 10);
  let headerRowNum = 1;
  let map: Partial<Record<keyof ParsedRow, number>> = {};
  let bestScore = -1;
  for (let r = 1; r <= scanLimit; r++) {
    const cells = readRowCells(ws, r).map((c) => str(c));
    const candidate = buildHeaderMap(cells);
    const score = REQUIRED.filter((k) => candidate[k] !== undefined).length;
    if (score > bestScore) {
      bestScore = score;
      map = candidate;
      headerRowNum = r;
    }
  }

  const headerCells = readRowCells(ws, headerRowNum).map((c) => str(c));

  // Fallback: an unlabelled leading column that holds the emp ID is a common
  // export quirk (header cell is blank). Claim the first blank-header column
  // for empCode when it wasn't matched by name.
  if (map.empCode === undefined) {
    const used = new Set(Object.values(map));
    for (let i = 0; i < headerCells.length; i++) {
      if (!used.has(i) && normalize(headerCells[i]) === "") {
        map = { ...map, empCode: i };
        break;
      }
    }
  }

  const missing = REQUIRED.filter((k) => map[k] === undefined);
  if (missing.length) {
    return {
      rows: [],
      errors: [
        {
          row: headerRowNum,
          message: `Missing required columns: ${missing.join(", ")}. Expected headers like: ${REQUIRED
            .map((k) => HEADER_ALIASES[k][0])
            .join(", ")}. The Role column must contain "employee" or "Intern".`,
        },
      ],
    };
  }

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber <= headerRowNum) return; // skip banner + header rows
    const cells: unknown[] = [];
    row.eachCell({ includeEmpty: true }, (c, colNumber) => {
      cells[colNumber - 1] = c.value;
    });
    const cell = (k: keyof ParsedRow) => cells[map[k] as number];

    const empCode = str(cell("empCode"));
    const email = str(cell("email"));
    if (!empCode && !email) return; // skip empty rows
    if (!email) {
      errors.push({ row: rowNumber, message: "Missing email" });
      return;
    }

    const role = parseRole(str(cell("role")));
    if (role === null) {
      const raw = str(cell("role"));
      errors.push({
        row: rowNumber,
        message: `Invalid Role "${raw || "(blank)"}" — must be exactly "employee" or "Intern"`,
      });
      return;
    }

    rows.push({
      empCode,
      name: str(cell("name")) || empCode || email,
      email: email.toLowerCase(),
      role,
      project: str(cell("project")),
      organization: str(cell("organization")) || undefined,
      productivityCycles: num(cell("productivityCycles"), 1),
      hoursPerCycle: num(cell("hoursPerCycle"), 40),
      hoursWorked: num(cell("hoursWorked")),
      defects: num(cell("defects")),
      defectFixHours: num(cell("defectFixHours")),
      lifecycle:  map.lifecycle  !== undefined ? str(cell("lifecycle"))  || undefined : undefined,
      phase:      map.phase      !== undefined ? str(cell("phase"))      || undefined : undefined,
      department: map.department !== undefined ? str(cell("department")) || undefined : undefined,
      cycleStart: map.cycleStart !== undefined ? dateVal(cell("cycleStart")) : undefined,
      cycleEnd:   map.cycleEnd   !== undefined ? dateVal(cell("cycleEnd"))   : undefined,
    });
  });

  return { rows, errors };
}
