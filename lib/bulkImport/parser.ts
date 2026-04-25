import ExcelJS from "exceljs";

/**
 * Bulk-employee-import file format.
 *
 * Header aliases match common spellings so customers don't have to
 * reformat their HRIS exports. Required columns are validated up-front
 * with a clear error message on the first row.
 */

export interface BulkRow {
  rowNumber: number;
  empCode: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  role: "EMPLOYEE" | "DEPT_HEAD";
  yearsExperience: number;
  softSkillScore: number;
  project: string | null;
  strengths: { name: string; score: number }[];
  certifications: string[];
}

export interface BulkParseResult {
  rows: BulkRow[];
  errors: { row: number; message: string }[];
}

type FieldKey =
  | "empCode"
  | "firstName"
  | "lastName"
  | "email"
  | "department"
  | "role"
  | "yearsExperience"
  | "softSkillScore"
  | "project"
  | "strengths"
  | "certifications";

const HEADER_ALIASES: Record<FieldKey, string[]> = {
  empCode: ["emp id", "empid", "employee id", "id", "emp_code", "emp code"],
  firstName: ["first name", "firstname", "given name"],
  lastName: ["last name", "lastname", "surname", "family name"],
  email: ["email", "email id", "e-mail", "work email"],
  department: ["department", "dept", "department name"],
  role: ["role", "user role", "designation type"],
  yearsExperience: [
    "years of experience",
    "years experience",
    "experience",
    "yrs of experience",
    "yrs experience",
  ],
  softSkillScore: [
    "soft skill score",
    "soft skills",
    "soft skill",
    "soft-skill score",
  ],
  project: ["project", "current project", "project name"],
  strengths: ["strengths", "skills", "competencies"],
  certifications: ["certifications", "certs", "certificates"],
};

const REQUIRED: FieldKey[] = [
  "empCode",
  "firstName",
  "lastName",
  "email",
  "department",
];

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ");
}

function buildHeaderMap(headerRow: string[]): Partial<Record<FieldKey, number>> {
  const map: Partial<Record<FieldKey, number>> = {};
  const normalized = headerRow.map((h) => normalize(String(h ?? "")));
  for (const key of Object.keys(HEADER_ALIASES) as FieldKey[]) {
    const aliases = HEADER_ALIASES[key].map(normalize);
    const idx = normalized.findIndex((h) => aliases.includes(h));
    if (idx >= 0) map[key] = idx;
  }
  return map;
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object" && v !== null && "text" in (v as Record<string, unknown>)) {
    return String((v as { text: unknown }).text ?? "").trim();
  }
  return String(v).trim();
}

function num(v: unknown, fallback: number): number {
  if (v === null || v === undefined || v === "") return fallback;
  const n = typeof v === "number" ? v : Number(String(v).trim());
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function parseStrengths(raw: string): { name: string; score: number }[] {
  if (!raw) return [];
  const out: { name: string; score: number }[] = [];
  for (const part of raw.split("|")) {
    const seg = part.trim();
    if (!seg) continue;
    const [namePart, scorePart] = seg.split(":").map((s) => s.trim());
    if (!namePart) continue;
    const score = scorePart ? clamp(Number(scorePart) || 5, 0, 10) : 5;
    out.push({ name: namePart, score });
  }
  return out;
}

function parseCerts(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function parseRole(raw: string): "EMPLOYEE" | "DEPT_HEAD" {
  const v = raw.toLowerCase().replace(/[^a-z]/g, "");
  if (v === "depthead" || v === "departmenthead" || v === "head") return "DEPT_HEAD";
  return "EMPLOYEE";
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function parseBulkEmployeesBuffer(
  buf: ArrayBuffer | Buffer,
): Promise<BulkParseResult> {
  const wb = new ExcelJS.Workbook();
  const ab =
    buf instanceof ArrayBuffer
      ? buf
      : buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  await wb.xlsx.load(ab as ArrayBuffer);
  const ws = wb.worksheets[0];
  if (!ws) {
    return { rows: [], errors: [{ row: 0, message: "Workbook has no sheets." }] };
  }

  const headerCells: string[] = [];
  ws.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headerCells[colNumber - 1] = str(cell.value);
  });
  const map = buildHeaderMap(headerCells);

  const missing = REQUIRED.filter((k) => map[k] === undefined);
  if (missing.length > 0) {
    return {
      rows: [],
      errors: [
        {
          row: 1,
          message: `Missing required columns: ${missing
            .map((k) => HEADER_ALIASES[k][0])
            .join(", ")}. Download the template for the canonical layout.`,
        },
      ],
    };
  }

  const rows: BulkRow[] = [];
  const errors: { row: number; message: string }[] = [];
  const seenEmails = new Set<string>();
  const seenCodes = new Set<string>();

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const cell = (k: FieldKey) =>
      row.getCell((map[k] as number) + 1).value;

    const empCode = str(cell("empCode"));
    const firstName = str(cell("firstName"));
    const lastName = str(cell("lastName"));
    const email = str(cell("email")).toLowerCase();
    const department = str(cell("department"));

    // Skip blank rows silently
    if (!empCode && !email && !firstName && !lastName) return;

    const rowErrors: string[] = [];
    if (!empCode) rowErrors.push("missing Emp ID");
    if (!firstName) rowErrors.push("missing First Name");
    if (!lastName) rowErrors.push("missing Last Name");
    if (!email) rowErrors.push("missing Email");
    else if (!isValidEmail(email)) rowErrors.push(`invalid email "${email}"`);
    if (!department) rowErrors.push("missing Department");

    if (email && seenEmails.has(email)) {
      rowErrors.push(`duplicate email in file: ${email}`);
    }
    if (empCode && seenCodes.has(empCode)) {
      rowErrors.push(`duplicate Emp ID in file: ${empCode}`);
    }

    if (rowErrors.length > 0) {
      errors.push({ row: rowNumber, message: rowErrors.join("; ") });
      return;
    }

    seenEmails.add(email);
    seenCodes.add(empCode);

    const role = map.role !== undefined ? parseRole(str(cell("role"))) : "EMPLOYEE";
    const yearsExperience =
      map.yearsExperience !== undefined ? Math.max(0, num(cell("yearsExperience"), 0)) : 0;
    const softSkillScore =
      map.softSkillScore !== undefined
        ? clamp(num(cell("softSkillScore"), 5), 0, 10)
        : 5;
    const project =
      map.project !== undefined ? str(cell("project")) || null : null;
    const strengths =
      map.strengths !== undefined ? parseStrengths(str(cell("strengths"))) : [];
    const certifications =
      map.certifications !== undefined ? parseCerts(str(cell("certifications"))) : [];

    rows.push({
      rowNumber,
      empCode,
      firstName,
      lastName,
      email,
      department,
      role,
      yearsExperience,
      softSkillScore,
      project,
      strengths,
      certifications,
    });
  });

  return { rows, errors };
}
