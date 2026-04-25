import ExcelJS from "exceljs";

export interface ParsedRow {
  empCode: string;
  name: string;
  email: string;
  project: string;
  organization?: string;
  productivityCycles: number;
  hoursPerCycle: number;
  hoursWorked: number;
  defects: number;
  defectFixHours: number;
}

export interface ParseResult {
  rows: ParsedRow[];
  errors: { row: number; message: string }[];
}

const HEADER_ALIASES: Record<keyof ParsedRow, string[]> = {
  empCode: ["emp id", "empid", "employee id", "id", "emp_code", "emp code"],
  name: ["emp name", "name", "employee name", "full name"],
  email: ["email", "email id", "e-mail"],
  project: ["project", "project name"],
  organization: ["organization", "org", "company"],
  productivityCycles: ["productivity cycles", "cycles", "no of cycles"],
  hoursPerCycle: ["hours per cycle", "hrs per cycle", "cycle hours"],
  hoursWorked: ["hours worked", "worked hours", "actual hours"],
  defects: ["defects", "no of defects", "number of defects", "defect count"],
  defectFixHours: [
    "defect fix hours",
    "time to fix defects",
    "fix time",
    "defect fix time",
    "time required to fix defects",
    "time required to fix those defects",
  ],
};

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

  // First row = header
  const headerCells: string[] = [];
  ws.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headerCells[colNumber - 1] = str(cell.value);
  });
  const map = buildHeaderMap(headerCells);

  const required: (keyof ParsedRow)[] = [
    "empCode",
    "name",
    "email",
    "hoursWorked",
    "defects",
    "defectFixHours",
  ];
  const missing = required.filter((k) => map[k] === undefined);
  if (missing.length) {
    return {
      rows: [],
      errors: [
        {
          row: 1,
          message: `Missing required columns: ${missing.join(", ")}. Expected headers like: ${required
            .map((k) => HEADER_ALIASES[k][0])
            .join(", ")}`,
        },
      ],
    };
  }

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const cell = (k: keyof ParsedRow) => row.getCell((map[k] as number) + 1).value;

    const empCode = str(cell("empCode"));
    const email = str(cell("email"));
    if (!empCode && !email) return; // skip empty rows
    if (!empCode) {
      errors.push({ row: rowNumber, message: "Missing emp ID" });
      return;
    }
    if (!email) {
      errors.push({ row: rowNumber, message: "Missing email" });
      return;
    }

    rows.push({
      empCode,
      name: str(cell("name")) || empCode,
      email: email.toLowerCase(),
      project: str(cell("project")),
      organization: str(cell("organization")) || undefined,
      productivityCycles: num(cell("productivityCycles"), 1),
      hoursPerCycle: num(cell("hoursPerCycle"), 40),
      hoursWorked: num(cell("hoursWorked")),
      defects: num(cell("defects")),
      defectFixHours: num(cell("defectFixHours")),
    });
  });

  return { rows, errors };
}
