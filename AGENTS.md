# AGENTS.md — Failure-to-Role Mapping Platform

> Read this first. These rules apply to every code change in this repository.

---

## 1. What we are building

A **multi-tenant, multi-role SaaS platform** where companies measure employee
performance over configurable productivity cycles (bimonthly / monthly /
quarterly / yearly), surface failure patterns, and recommend better-aligned
roles using a Failure Intelligence Mapper.

The platform has 4 roles:

| Role          | Capabilities                                                                                              |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| `EMPLOYEE`    | View own analysis, give feedback on suggested roles, request a role change with reason, update profile (new tech learned, certifications, personality test). |
| `DEPT_HEAD`   | Create projects, assign employees to projects (with relocation warning), upload weekly/monthly Excel reports, configure cycle duration, view dept analytics. |
| `ADMIN`       | Create departments, assign/change dept heads, view org-wide dashboards, invite users.                    |
| `SUPER_ADMIN` | Create/edit organizations, manage emails for support tiers, platform-wide audit. (Reserved for the platform owner.) |

Onboarding flow:

```
Landing → Create Organization → Org Admin
       → Admin adds Departments + assigns Dept Heads
       → Dept Head invites Employees (joining code via email)
       → Employee logs in with code → completes profile
```

---

## 2. Core data flow

1. **Dept Head uploads an Excel sheet** with columns:
   `emp_name, emp_id (PK), email, project, organization, productivity_cycles,
   hours_per_cycle, hours_worked, defects, defect_fix_time_hours`.
2. Platform parses the sheet → maps each row to a `User` via `emp_id` →
   creates a `PerformanceRecord` for the active `ProductivityCycle`.
3. We compute **Avg Turn-Around Time per defect** =
   `defect_fix_time_hours / defects` (only when `defects > 0`).
4. After every cycle (configurable per dept), we run the **Failure Intelligence
   Mapper** over all records in the cycle window. Results live in
   `RoleSuggestion`, `FailureEvent`, `Strength`.
5. Reminders to Dept Heads: surface banners at **T-10, T-7, T-5, T-3, T-2, T-1,
   T-0 days** before cycle end if no Excel uploaded. Log each reminder shown.

---

## 3. Failure Intelligence Mapper (DL/AI component)

Live in `lib/engine/`. Pure TypeScript, no Python. Each algorithm is composable.

| Module                 | Responsibility                                                            |
| ---------------------- | ------------------------------------------------------------------------- |
| `failureAnalyzer.ts`   | Failure Pattern Analysis Engine — weighted scoring (severity × category × recency). |
| `resilience.ts`        | Resilience Index (recovery speed + outcome improvement + soft-skill buffer). |
| `roleMatcher.ts`       | Role Re-Matching via cosine similarity over skill/experience vectors.    |
| `leadership.ts`        | Leadership Potential Extraction + Long-Term Leadership Forecasting.      |
| `explainability.ts`    | SHAP-like feature importance for every suggestion.                       |
| `ethics.ts`            | PASSIONIT (9D) + PRUTL (5D) compliance audit.                            |

When extending: add new files to `lib/engine/`, export pure functions, never
read from the DB inside the engine — pass plain objects in / plain results out.
Tech-vs-management role mapping should consider:
- `defects + on-time submission rate` → tech roles
- `recovery from team conflicts + stakeholder management strengths` → mgmt roles

---

## 4. ⚠️ NO MOCK DATA — EVER

This is a real client project. The user said this explicitly.

- **Do not** seed fake employees, departments, or organizations.
- **Do not** display hard-coded sample numbers in any UI.
- If a required input is missing, the UI must say so and provide a path to
  capture it (e.g. "Upload an Excel report to see this chart").
- The only seed allowed is **one platform super-admin user** so the system
  can boot. Print the credentials on first run.

If a field is unknown, render an empty state — never a placeholder value.

---

## 5. Styling rules — DO NOT DEVIATE

The visual system is locked. **All new pages and components must reuse these
existing primitives** so the platform stays visually consistent.

### Design tokens (defined in `app/globals.css` via `@theme`)
- Colors: `primary-{50..900}` (indigo), `surface-{50..950}` (gray)
- Plus Tailwind's built-in `emerald`, `amber`, `violet`, `red` (used sparingly
  for status only).

### Component classes (already defined, **use these instead of ad-hoc utility soup**)
- Layout: `mesh-gradient`, `card`, `card-soft`, `stat-card` (+ `stat-card-{indigo,emerald,violet,amber}`)
- Nav: `top-nav`, `nav-link`, `nav-link-active`
- Buttons: `btn-primary`, `btn-ghost`
- Badges: `badge` + `badge-{indigo,emerald,amber,red,violet,low,medium,high}`
- Inputs: `input-search`
- Tables: wrap `<table>` in `<div class="table-container">`
- Animations: `animate-fade-in`, `animate-slide-up`, `animate-float`, `animate-draw-line`, `animate-node-appear`, `pulse-dot`

### Conventions
- Page root: `<div className="animate-fade-in space-y-8">…</div>`
- Page header pattern: an `<h2 className="text-2xl font-bold text-surface-900">`
  followed by `<p className="mt-1 text-sm text-surface-500">…</p>`
- Icon set: **only** `lucide-react`. No other icon libs.
- Charts: **only** `recharts`. No other chart libs.
- Dark mode: not in scope yet — design is light-mode Clearbit-inspired.
- If you genuinely need a new component class, add it to the `@layer components`
  block in `app/globals.css` rather than inlining a long Tailwind string. Match
  the existing rounding (`12px` for inputs/buttons, `16px`/`20px` for cards),
  shadow style (soft indigo glow on hover), and transition timings (~`0.25s`
  ease, cubic-bezier `(0.4, 0, 0.2, 1)` for cards).

---

## 6. Tech stack (locked)

- Next.js 16 App Router (Turbopack)
- React 19, TypeScript 5
- Tailwind CSS v4 (config in `globals.css`, not a `tailwind.config`)
- Prisma 5 + SQLite (`prisma/dev.db`)
- `bcryptjs` for password hashing
- HMAC-signed cookie session (no third-party auth provider)
- `xlsx` (SheetJS) for Excel parsing
- `lucide-react` icons, `recharts` charts

`npm run dev` does:
1. `prisma db push --skip-generate`
2. `tsx lib/seed.ts` (idempotent — only seeds super-admin if missing)
3. `next dev`

---

## 7. Project layout

```
app/
  (marketing)/page.tsx        # Landing
  (auth)/login/page.tsx
  (auth)/register/page.tsx     # Create org + admin
  (auth)/join/page.tsx         # Join via invitation code
  (app)/dashboard/page.tsx     # Redirector → role dashboard
  (app)/employee/...           # Employee role pages
  (app)/dept/...               # Dept head pages
  (app)/admin/...              # Org admin pages
  (app)/super/...              # Super admin pages
  api/...                      # Route handlers
components/                    # Shared UI
lib/
  auth.ts                      # session helpers
  db.ts                        # prisma singleton
  api.ts                       # client fetchers
  reminders.ts                 # cycle reminder logic
  excel.ts                     # xlsx parsing
  engine/...                   # Failure Intelligence Mapper
prisma/schema.prisma
```

---

## 8. API conventions

- All API routes return JSON. Errors: `{ error: string }` with appropriate
  HTTP status.
- Auth-protected routes call `requireUser(req, [roles])` from `lib/auth.ts`.
- Org-scoped queries always filter by `orgId` from the session — never trust
  the client.
- Mutations that affect another user (e.g. relocating someone to a new
  project) must require an explicit `confirm: true` flag in the body and
  return a warning preview when omitted.

---

## 9. Feedback & learning loop

- Every `RoleSuggestion` shown to an Employee can be rated (`accepted`,
  `rejected`, `unsure`) plus a free-text reason.
- Stored as `RoleFeedback` and exposed to Dept Head / Admin dashboards as a
  signal for the model. Future ML iterations should consume this as labels.

---

## 10. When in doubt

- Ask the user before introducing a new top-level dependency.
- Prefer extending existing files over creating new ones.
- Never invent business numbers; always derive from real DB rows.
- Match the existing card/button/badge primitives — if the new screen feels
  visually different from `/` or `/masters`, it is wrong.
