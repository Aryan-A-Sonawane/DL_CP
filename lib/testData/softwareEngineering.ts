/**
 * Canonical demo dataset for the Software Engineering department.
 *
 * One source of truth used by:
 *   1. /api/admin/test-data/seed-software-engineering   (creates users + projects)
 *   2. /api/admin/test-data/sample-excel               (generates upload-ready .xlsx)
 *
 * The two endpoints share the same `EMPLOYEES` and `PROJECTS` arrays, so the
 * Excel rows always line up with the seeded users by `empCode`.
 *
 * The 20 employees span five archetypes designed to exercise the Failure
 * Intelligence Mapper meaningfully on the very first cycle:
 *
 *   - top         strong tech / leadership profile, low defects, on-time
 *   - senior      experienced specialist (devops, data, architect)
 *   - mid         solid contributor, moderate defects, on-time
 *   - struggler   high defects + slow TAT — should trigger role re-matching
 *   - underused   low hours, low output — possible re-assignment candidate
 *   - recoverer   high soft-skill SRE/DevOps fit, decent metrics
 */

export const DEPARTMENT_NAME = "Software Engineering";

export const PROJECTS = [
  { name: "Apollo Migration", description: "Backend modernization to event-driven services." },
  { name: "Helios Mobile App", description: "Customer-facing mobile experience (React Native)." },
  { name: "Orion Analytics", description: "Real-time dashboards on the new data platform." },
  { name: "Vega Web Portal", description: "Customer-portal redesign with the new design system." },
] as const;

export type ProjectName = (typeof PROJECTS)[number]["name"];

export interface DemoStrength {
  name: string;
  score: number;
}

export interface DemoEmployee {
  empCode: string;
  firstName: string;
  lastName: string;
  email: string;
  /** Plaintext password — `Firstname@12345`. Hashed before insert. */
  password: string;
  archetype: "top" | "senior" | "mid" | "struggler" | "underused" | "recoverer";
  yearsExperience: number;
  softSkillScore: number;
  strengths: DemoStrength[];
  project: ProjectName;
  /** Cycle-1 performance numbers used for the sample Excel. */
  cycle1: {
    hoursPerCycle: number;
    hoursWorked: number;
    defects: number;
    defectFixHours: number;
  };
}

const e = (
  empCode: string,
  firstName: string,
  lastName: string,
  archetype: DemoEmployee["archetype"],
  yearsExperience: number,
  softSkillScore: number,
  strengths: DemoStrength[],
  project: ProjectName,
  cycle1: DemoEmployee["cycle1"],
): DemoEmployee => ({
  empCode,
  firstName,
  lastName,
  email: `${firstName.toLowerCase()}@demo.local`,
  password: `${firstName}@12345`,
  archetype,
  yearsExperience,
  softSkillScore,
  strengths,
  project,
  cycle1,
});

const C = { hpc: 40 };

export const EMPLOYEES: DemoEmployee[] = [
  // ── Top performers ────────────────────────────────────────────────────
  e("SE-001", "Aarav", "Sharma", "top", 7, 8.0,
    [
      { name: "Problem Solving", score: 9 },
      { name: "System Thinking", score: 9 },
      { name: "Architecture Design", score: 9 },
      { name: "Deep Technical Knowledge", score: 8 },
    ],
    "Apollo Migration",
    { hoursPerCycle: C.hpc, hoursWorked: 42, defects: 1, defectFixHours: 1.5 }),

  e("SE-002", "Aditi", "Verma", "top", 8, 9.0,
    [
      { name: "Leadership", score: 9 },
      { name: "Communication", score: 9 },
      { name: "Empathy", score: 8 },
      { name: "Stakeholder Management", score: 8 },
      { name: "Strategic Vision", score: 7 },
    ],
    "Vega Web Portal",
    { hoursPerCycle: C.hpc, hoursWorked: 40, defects: 2, defectFixHours: 4 }),

  // ── Senior specialists ────────────────────────────────────────────────
  e("SE-003", "Akash", "Mehta", "senior", 6, 7.5,
    [
      { name: "Automation Mindset", score: 9 },
      { name: "Crisis Management", score: 8 },
      { name: "Deep Technical Knowledge", score: 8 },
      { name: "System Thinking", score: 8 },
      { name: "Quick Recovery", score: 7 },
    ],
    "Orion Analytics",
    { hoursPerCycle: C.hpc, hoursWorked: 39, defects: 3, defectFixHours: 8 }),

  e("SE-004", "Ananya", "Iyer", "senior", 5, 7.0,
    [
      { name: "Analytical Thinking", score: 9 },
      { name: "System Thinking", score: 8 },
      { name: "Automation Mindset", score: 8 },
      { name: "Process Improvement", score: 7 },
      { name: "Attention To Detail", score: 8 },
    ],
    "Orion Analytics",
    { hoursPerCycle: C.hpc, hoursWorked: 41, defects: 2, defectFixHours: 5 }),

  // ── Mid contributors ──────────────────────────────────────────────────
  e("SE-005", "Arjun", "Patel", "mid", 3, 6.5,
    [
      { name: "Problem Solving", score: 7 },
      { name: "Deep Technical Knowledge", score: 6 },
      { name: "Attention To Detail", score: 7 },
    ],
    "Apollo Migration",
    { hoursPerCycle: C.hpc, hoursWorked: 40, defects: 5, defectFixHours: 14 }),

  e("SE-006", "Bhavya", "Kapoor", "mid", 3, 7.0,
    [
      { name: "Creativity", score: 7 },
      { name: "User Empathy", score: 7 },
      { name: "Visual Communication", score: 7 },
      { name: "Communication", score: 6 },
    ],
    "Vega Web Portal",
    { hoursPerCycle: C.hpc, hoursWorked: 38, defects: 6, defectFixHours: 18 }),

  e("SE-007", "Chirag", "Desai", "mid", 2, 6.5,
    [
      { name: "Problem Solving", score: 6 },
      { name: "Adaptability", score: 7 },
      { name: "Communication", score: 6 },
    ],
    "Helios Mobile App",
    { hoursPerCycle: C.hpc, hoursWorked: 37, defects: 5, defectFixHours: 16 }),

  e("SE-008", "Diya", "Reddy", "mid", 4, 6.5,
    [
      { name: "Attention To Detail", score: 8 },
      { name: "Process Improvement", score: 7 },
      { name: "Analytical Thinking", score: 7 },
    ],
    "Vega Web Portal",
    { hoursPerCycle: C.hpc, hoursWorked: 40, defects: 4, defectFixHours: 12 }),

  e("SE-009", "Esha", "Nair", "mid", 3, 6.5,
    [
      { name: "Analytical Thinking", score: 7 },
      { name: "Storytelling With Data", score: 7 },
      { name: "Communication", score: 6 },
    ],
    "Apollo Migration",
    { hoursPerCycle: C.hpc, hoursWorked: 39, defects: 6, defectFixHours: 21 }),

  // ── Strugglers (role re-mapping candidates) ───────────────────────────
  e("SE-010", "Farhan", "Khan", "struggler", 4, 8.5,
    [
      { name: "Empathy", score: 9 },
      { name: "Active Listening", score: 8 },
      { name: "Communication", score: 8 },
      { name: "Relationship Building", score: 8 },
    ],
    "Vega Web Portal",
    { hoursPerCycle: C.hpc, hoursWorked: 30, defects: 12, defectFixHours: 90 }),

  e("SE-011", "Gaurav", "Rao", "struggler", 3, 7.5,
    [
      { name: "Persuasion", score: 8 },
      { name: "Communication", score: 7 },
      { name: "Trend Analysis", score: 6 },
      { name: "Creativity", score: 7 },
    ],
    "Helios Mobile App",
    { hoursPerCycle: C.hpc, hoursWorked: 28, defects: 14, defectFixHours: 110 }),

  e("SE-012", "Harini", "Pillai", "struggler", 2, 8.0,
    [
      { name: "User Empathy", score: 9 },
      { name: "Creativity", score: 8 },
      { name: "Storytelling With Data", score: 7 },
      { name: "Visual Communication", score: 7 },
    ],
    "Vega Web Portal",
    { hoursPerCycle: C.hpc, hoursWorked: 32, defects: 10, defectFixHours: 75 }),

  e("SE-013", "Ishaan", "Joshi", "struggler", 3, 7.0,
    [
      { name: "Persuasion", score: 7 },
      { name: "Creativity", score: 7 },
      { name: "Trend Analysis", score: 7 },
      { name: "Communication", score: 6 },
    ],
    "Helios Mobile App",
    { hoursPerCycle: C.hpc, hoursWorked: 31, defects: 11, defectFixHours: 88 }),

  // ── Underutilized ─────────────────────────────────────────────────────
  e("SE-014", "Jaya", "Bhatt", "underused", 2, 6.0,
    [
      { name: "Analytical Thinking", score: 8 },
      { name: "Attention To Detail", score: 7 },
      { name: "Process Improvement", score: 6 },
    ],
    "Orion Analytics",
    { hoursPerCycle: C.hpc, hoursWorked: 26, defects: 1, defectFixHours: 2 }),

  e("SE-015", "Kabir", "Saxena", "underused", 2, 6.5,
    [
      { name: "System Thinking", score: 7 },
      { name: "Strategic Vision", score: 6 },
      { name: "Risk Assessment", score: 6 },
    ],
    "Helios Mobile App",
    { hoursPerCycle: C.hpc, hoursWorked: 28, defects: 2, defectFixHours: 5 }),

  // ── Crisis recoverers (SRE / DevOps fit) ──────────────────────────────
  e("SE-016", "Lavanya", "Menon", "recoverer", 5, 7.5,
    [
      { name: "Crisis Management", score: 9 },
      { name: "Quick Recovery", score: 9 },
      { name: "Automation Mindset", score: 8 },
      { name: "Attention To Detail", score: 8 },
      { name: "Deep Technical Knowledge", score: 7 },
    ],
    "Orion Analytics",
    { hoursPerCycle: C.hpc, hoursWorked: 40, defects: 4, defectFixHours: 14 }),

  e("SE-017", "Manish", "Gupta", "recoverer", 6, 7.0,
    [
      { name: "Crisis Management", score: 8 },
      { name: "Automation Mindset", score: 9 },
      { name: "Process Improvement", score: 8 },
      { name: "System Thinking", score: 8 },
    ],
    "Apollo Migration",
    { hoursPerCycle: C.hpc, hoursWorked: 41, defects: 3, defectFixHours: 9 }),

  // ── More top tier (product + leadership) ──────────────────────────────
  e("SE-018", "Nidhi", "Agarwal", "top", 6, 8.5,
    [
      { name: "Strategic Vision", score: 9 },
      { name: "Visionary Thinking", score: 9 },
      { name: "Stakeholder Management", score: 8 },
      { name: "Communication", score: 8 },
      { name: "Cross Functional Leadership", score: 8 },
    ],
    "Helios Mobile App",
    { hoursPerCycle: C.hpc, hoursWorked: 42, defects: 1, defectFixHours: 2 }),

  e("SE-019", "Omkar", "Bhosle", "senior", 9, 7.0,
    [
      { name: "Problem Solving", score: 9 },
      { name: "System Thinking", score: 9 },
      { name: "Architecture Design", score: 8 },
      { name: "Deep Technical Knowledge", score: 8 },
    ],
    "Apollo Migration",
    { hoursPerCycle: C.hpc, hoursWorked: 39, defects: 2, defectFixHours: 6 }),

  e("SE-020", "Priya", "Singh", "top", 7, 9.0,
    [
      { name: "Leadership", score: 9 },
      { name: "Team Conflict Resolution", score: 9 },
      { name: "Empathy", score: 8 },
      { name: "Cross Functional Leadership", score: 8 },
      { name: "Stakeholder Management", score: 8 },
    ],
    "Vega Web Portal",
    { hoursPerCycle: C.hpc, hoursWorked: 41, defects: 2, defectFixHours: 4 }),
];

/** Sanity check: every employee maps to one of the listed projects. */
export function validateFixture() {
  const projectNames = new Set(PROJECTS.map((p) => p.name));
  for (const emp of EMPLOYEES) {
    if (!projectNames.has(emp.project)) {
      throw new Error(`Fixture error: ${emp.empCode} → unknown project ${emp.project}`);
    }
  }
}
