/**
 * Role Catalog — single source of truth for all suggestable roles.
 * 100 roles across 13 categories covering the full IT company org structure.
 *
 * Rules:
 *  - Engine only suggests roles that exist in an org's active OrgRole list.
 *  - On org creation the admin selects an org type; the preset roles for that
 *    type are seeded as active OrgRoles.
 *  - Admins can always add / remove / toggle roles from /admin/roles.
 */

export type RoleCategory =
  | "Engineering"
  | "Testing & QA"
  | "Data & Analytics"
  | "DevOps & Infrastructure"
  | "Product & Design"
  | "Architecture"
  | "Management"
  | "HR"
  | "Marketing"
  | "Sales"
  | "Admin & Operations"
  | "Finance"
  | "Support";

export const ALL_CATEGORIES: RoleCategory[] = [
  "Engineering",
  "Testing & QA",
  "Data & Analytics",
  "DevOps & Infrastructure",
  "Product & Design",
  "Architecture",
  "Management",
  "HR",
  "Marketing",
  "Sales",
  "Admin & Operations",
  "Finance",
  "Support",
];

export interface CatalogRole {
  title: string;
  category: RoleCategory;
}

export const ROLE_CATALOG: CatalogRole[] = [
  // ── Engineering (20) ────────────────────────────────────────
  { title: "Frontend Developer",          category: "Engineering" },
  { title: "Backend Developer",           category: "Engineering" },
  { title: "Full Stack Developer",        category: "Engineering" },
  { title: "Mobile Developer (iOS)",      category: "Engineering" },
  { title: "Mobile Developer (Android)",  category: "Engineering" },
  { title: "Software Engineer",           category: "Engineering" },
  { title: "Lead Software Engineer",      category: "Engineering" },
  { title: "Principal Engineer",          category: "Engineering" },
  { title: "Embedded Systems Engineer",   category: "Engineering" },
  { title: "API Developer",               category: "Engineering" },
  { title: "Cloud Engineer",              category: "Engineering" },
  { title: "Security Engineer",           category: "Engineering" },
  { title: "Game Developer",              category: "Engineering" },
  { title: "AR/VR Developer",             category: "Engineering" },
  { title: "Blockchain Developer",        category: "Engineering" },
  { title: "Firmware Engineer",           category: "Engineering" },
  { title: "Integration Engineer",        category: "Engineering" },
  { title: "Systems Engineer",            category: "Engineering" },
  { title: "SDK Developer",               category: "Engineering" },
  { title: "Platform Developer",          category: "Engineering" },

  // ── Testing & QA (10) ───────────────────────────────────────
  { title: "Manual Tester",               category: "Testing & QA" },
  { title: "Automation Test Engineer",    category: "Testing & QA" },
  { title: "QA Lead",                     category: "Testing & QA" },
  { title: "Performance Tester",          category: "Testing & QA" },
  { title: "Security Tester",             category: "Testing & QA" },
  { title: "Test Architect",              category: "Testing & QA" },
  { title: "SDET",                        category: "Testing & QA" },
  { title: "UAT Specialist",              category: "Testing & QA" },
  { title: "Mobile QA Engineer",          category: "Testing & QA" },
  { title: "Accessibility Tester",        category: "Testing & QA" },

  // ── Data & Analytics (10) ───────────────────────────────────
  { title: "Data Analyst",                category: "Data & Analytics" },
  { title: "Data Scientist",              category: "Data & Analytics" },
  { title: "Data Engineer",               category: "Data & Analytics" },
  { title: "Machine Learning Engineer",   category: "Data & Analytics" },
  { title: "AI Research Engineer",        category: "Data & Analytics" },
  { title: "Business Intelligence Analyst", category: "Data & Analytics" },
  { title: "Data Architect",              category: "Data & Analytics" },
  { title: "Analytics Engineer",          category: "Data & Analytics" },
  { title: "NLP Engineer",                category: "Data & Analytics" },
  { title: "Computer Vision Engineer",    category: "Data & Analytics" },

  // ── DevOps & Infrastructure (8) ─────────────────────────────
  { title: "DevOps Engineer",             category: "DevOps & Infrastructure" },
  { title: "Cloud Architect",             category: "DevOps & Infrastructure" },
  { title: "Infrastructure Engineer",     category: "DevOps & Infrastructure" },
  { title: "Site Reliability Engineer",   category: "DevOps & Infrastructure" },
  { title: "Platform Engineer",           category: "DevOps & Infrastructure" },
  { title: "Kubernetes Specialist",       category: "DevOps & Infrastructure" },
  { title: "Network Engineer",            category: "DevOps & Infrastructure" },
  { title: "Database Administrator",      category: "DevOps & Infrastructure" },

  // ── Product & Design (8) ────────────────────────────────────
  { title: "Product Manager",             category: "Product & Design" },
  { title: "Product Owner",               category: "Product & Design" },
  { title: "UX Designer",                 category: "Product & Design" },
  { title: "UI Designer",                 category: "Product & Design" },
  { title: "UX Researcher",               category: "Product & Design" },
  { title: "Product Strategist",          category: "Product & Design" },
  { title: "Design Lead",                 category: "Product & Design" },
  { title: "Interaction Designer",        category: "Product & Design" },

  // ── Architecture (4) ────────────────────────────────────────
  { title: "Technical Architect",         category: "Architecture" },
  { title: "Solution Architect",          category: "Architecture" },
  { title: "Enterprise Architect",        category: "Architecture" },
  { title: "Software Architect",          category: "Architecture" },

  // ── Management (10) ─────────────────────────────────────────
  { title: "Engineering Manager",         category: "Management" },
  { title: "Technical Program Manager",   category: "Management" },
  { title: "Project Manager",             category: "Management" },
  { title: "Delivery Manager",            category: "Management" },
  { title: "Director of Engineering",     category: "Management" },
  { title: "VP of Engineering",           category: "Management" },
  { title: "CTO",                         category: "Management" },
  { title: "Scrum Master",                category: "Management" },
  { title: "Agile Coach",                 category: "Management" },
  { title: "Team Lead",                   category: "Management" },

  // ── HR (8) ──────────────────────────────────────────────────
  { title: "HR Manager",                          category: "HR" },
  { title: "HR Business Partner",                 category: "HR" },
  { title: "Talent Acquisition Specialist",       category: "HR" },
  { title: "Recruiter",                           category: "HR" },
  { title: "Learning & Development Specialist",   category: "HR" },
  { title: "Compensation & Benefits Analyst",     category: "HR" },
  { title: "People Operations Manager",           category: "HR" },
  { title: "HR Generalist",                       category: "HR" },

  // ── Marketing (6) ───────────────────────────────────────────
  { title: "Digital Marketing Manager",   category: "Marketing" },
  { title: "Content Strategist",          category: "Marketing" },
  { title: "SEO Specialist",              category: "Marketing" },
  { title: "Growth Marketer",             category: "Marketing" },
  { title: "Brand Manager",               category: "Marketing" },
  { title: "Marketing Analyst",           category: "Marketing" },

  // ── Sales (7) ───────────────────────────────────────────────
  { title: "Sales Manager",               category: "Sales" },
  { title: "Account Executive",           category: "Sales" },
  { title: "Business Development Manager", category: "Sales" },
  { title: "Sales Engineer",              category: "Sales" },
  { title: "Customer Success Manager",    category: "Sales" },
  { title: "Pre-Sales Consultant",        category: "Sales" },
  { title: "Enterprise Account Manager",  category: "Sales" },

  // ── Admin & Operations (5) ──────────────────────────────────
  { title: "Operations Manager",          category: "Admin & Operations" },
  { title: "Business Analyst",            category: "Admin & Operations" },
  { title: "Office Administrator",        category: "Admin & Operations" },
  { title: "Executive Assistant",         category: "Admin & Operations" },
  { title: "Process Improvement Specialist", category: "Admin & Operations" },

  // ── Finance (4) ─────────────────────────────────────────────
  { title: "Finance Manager",             category: "Finance" },
  { title: "Financial Analyst",           category: "Finance" },
  { title: "Accounting Specialist",       category: "Finance" },
  { title: "CFO",                         category: "Finance" },

  // ── Support (3) ─────────────────────────────────────────────
  { title: "Technical Support Engineer",  category: "Support" },
  { title: "Customer Support Lead",       category: "Support" },
  { title: "IT Help Desk Specialist",     category: "Support" },
];

// ── Org-type presets ──────────────────────────────────────────────────────────

export type OrgType =
  | "it_services"
  | "product"
  | "consulting"
  | "startup"
  | "enterprise"
  | "other";

export const ORG_TYPE_LABELS: Record<OrgType, string> = {
  it_services: "IT Services / Outsourcing",
  product:     "Product / SaaS",
  consulting:  "Management / IT Consulting",
  startup:     "Startup",
  enterprise:  "Enterprise / Corporate",
  other:       "Other",
};

/** Categories included per org type (roles outside these are not pre-seeded). */
const ORG_TYPE_CATEGORIES: Record<OrgType, RoleCategory[]> = {
  it_services: [
    "Engineering", "Testing & QA", "DevOps & Infrastructure",
    "Architecture", "Management", "HR", "Admin & Operations", "Support",
  ],
  product: [
    "Engineering", "Testing & QA", "Data & Analytics",
    "DevOps & Infrastructure", "Product & Design", "Architecture",
    "Management", "Marketing", "HR", "Support",
  ],
  consulting: [
    "Management", "Admin & Operations", "HR", "Finance",
    "Sales", "Engineering", "Data & Analytics", "Architecture",
  ],
  startup: [
    "Engineering", "Product & Design", "Data & Analytics",
    "Marketing", "Sales", "Management", "Support",
  ],
  enterprise: ALL_CATEGORIES, // all 100
  other:      ALL_CATEGORIES, // all 100
};

/**
 * Returns the role titles to activate when an org of the given type is created.
 * Result is a subset of ROLE_CATALOG titles.
 */
export function getPresetRoles(orgType: OrgType): string[] {
  const cats = new Set<string>(ORG_TYPE_CATEGORIES[orgType]);
  return ROLE_CATALOG.filter((r) => cats.has(r.category)).map((r) => r.title);
}

/** Returns roles grouped by category for display. */
export function groupByCategory(
  roles: CatalogRole[],
): Map<RoleCategory, CatalogRole[]> {
  const map = new Map<RoleCategory, CatalogRole[]>();
  for (const cat of ALL_CATEGORIES) map.set(cat, []);
  for (const r of roles) map.get(r.category)?.push(r);
  return map;
}
