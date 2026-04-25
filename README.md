# Failure-to-Role Mapping Platform

> Multi-tenant, multi-role workforce analytics platform. Department heads upload cycle reports, the **Failure Intelligence Mapper** extracts failure patterns, resilience and leadership signals, and recommends roles where each person will actually thrive — with full explainability and ethical auditing.

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![Postgres](https://img.shields.io/badge/PostgreSQL-336791?style=flat&logo=postgresql&logoColor=white)

A unified Next.js 16 application — UI, scoring engine, ethics audit, email, and Postgres data layer all run in a single deployable. The original FastAPI + React + Vite implementation is preserved on the [`legacy/fastapi-react`](https://github.com/Aryan-A-Sonawane/DL_CP/tree/legacy/fastapi-react) branch (tag `v1-fastapi-react`).

---

## ✨ Features at a glance

| Role | What they get |
|---|---|
| **Employee** | Personal progress charts, role suggestions, skills/certs/personality test, feedback on suggestions. |
| **Department Head** | Project + assignment management, Excel cycle uploads, configurable cycle duration, smart upload reminders, dept-level analytics. |
| **Org Admin** | Department CRUD, dept-head assignment, invitation management, org-wide health, ethical audit trail. |
| **Super Admin** | Cross-org oversight, suspend/rename orgs, platform-wide audit dashboard. |

Plus the **Failure Intelligence Mapper** core: Failure Pattern Analysis · Resilience Index · Growth-After-Setback · Leadership Extraction · Adaptive Role Re-Matching · Causal Experience Mapping · Emotional Recovery Modeling · Transformational Learning Score · Long-Term Leadership Forecast — all explainable, all auditable.

---

## 🚀 Quick Start (local)

### Prerequisites

- **Node.js 20.9+** and npm
- **PostgreSQL 14+** running somewhere (local Docker, [Neon](https://neon.tech), Supabase, Vercel Postgres, …)

### 1. Set env vars

```bash
cp .env.example .env
# Edit .env and at minimum set DATABASE_URL + SESSION_SECRET
```

For a one-line local Postgres in Docker:

```bash
docker run --name frm-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
# then: DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
```

### 2. Run

```bash
npm install
npm run dev
```

`npm run dev` runs `prisma db push` (creates the schema), seeds the **Super-Admin** account (only one — no mock orgs/employees), then starts Next.js (Turbopack) on http://localhost:3000.

Default super-admin credentials (override via env vars):

```
email:    owner@platform.local
password: Owner@12345
```

---

## 🔑 Environment Variables

See [`.env.example`](./.env.example) for the full list. Required in production:

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres connection string (use the **pooled** URL from Neon/Vercel PG) |
| `SESSION_SECRET` | ✅ | 32+ char random string for HMAC-signed session cookies |
| `APP_URL` | ✅ in prod | Used in invitation email links (e.g. `https://your-app.vercel.app`) |
| `SUPER_ADMIN_EMAIL` / `_PASSWORD` / `_NAME` | optional | Override the seeded super-admin |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | optional | Defaults to Gmail (`smtp.gmail.com`, `465`, `true`) |
| `SMTP_USER` / `SMTP_PASS` | optional* | If unset, invitation emails are skipped (codes still work in `/join`) |
| `SMTP_FROM` | optional | Display "From" — defaults to `SMTP_USER` |

\* If you want **invitation emails to actually send**, you need `SMTP_USER` + `SMTP_PASS`.

### 📧 Setting up Gmail SMTP

1. **Enable 2-Step Verification** on the Google account: <https://myaccount.google.com/security>
2. **Generate an App Password**: <https://myaccount.google.com/apppasswords>
   - App: **Mail**, Device: **Other → "Failure-to-Role"**
   - Google gives you a 16-character password (e.g. `abcd efgh ijkl mnop`).
3. **Paste it into `SMTP_PASS`** (with or without spaces — both work).

That's it. Invitations created from the Admin or Department-Head UI now arrive in the invitee's inbox with a one-click "Accept invitation" button.

---

## ☁️ Deploying to Vercel

1. **Provision a Postgres database** (any of):
   - [Neon](https://neon.tech) → free tier, copy the **Pooled connection** string.
   - Vercel dashboard → **Storage → Create → Postgres**.
   - Supabase, Railway, Render, etc.
2. **Push to GitHub.**
3. **Vercel → New Project → Import** your repo.
4. In **Settings → Environment Variables**, add (Production + Preview):

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | your pooled Postgres URL |
   | `SESSION_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
   | `APP_URL` | `https://<your-project>.vercel.app` |
   | `SUPER_ADMIN_EMAIL` | (optional override) |
   | `SUPER_ADMIN_PASSWORD` | (optional override) |
   | `SMTP_USER` | `s.aryan0505@gmail.com` |
   | `SMTP_PASS` | your 16-char Gmail App Password |
   | `SMTP_FROM` | `Failure-to-Role <s.aryan0505@gmail.com>` |
5. **Deploy.** The build runs `prisma db push` against the production DB and seeds the super-admin on first deploy.

> ⚠️ **Do not use SQLite on Vercel.** Vercel's serverless filesystem is read-only outside `/tmp`. Postgres (or any hosted DB) is required.

---

## 🏗️ Architecture

```
DL_CP/
├── app/
│   ├── (app)/                       # Authenticated routes
│   │   ├── layout.tsx               # AppNav + auth gate
│   │   ├── super/                   # Super-admin dashboards
│   │   ├── admin/                   # Org-admin dashboards
│   │   ├── dept/                    # Department-head dashboards
│   │   └── employee/                # Employee dashboards
│   ├── login/  register/  join/     # Auth pages
│   ├── api/
│   │   ├── auth/                    # login · logout · register · join
│   │   ├── super/orgs/[id]          # super-admin ops
│   │   ├── admin/{departments,invitations}
│   │   ├── dept/{projects,settings,uploads,assignments}
│   │   └── employee/{profile,skills,certifications,personality,feedback}
│   ├── page.tsx                     # Public landing page
│   └── globals.css                  # Tailwind v4 theme + components
├── components/
│   ├── AppNav.tsx                   # Role-aware nav
│   ├── AuthShell.tsx                # Login/register/join shell
│   ├── ReminderBanner.tsx           # Cycle reminder banners
│   └── EmployeeProgressChart.tsx    # Recharts visualisations
├── lib/
│   ├── db.ts                        # Prisma singleton
│   ├── auth.ts                      # Session, bcrypt, invite codes
│   ├── apiHelpers.ts                # withAuth() route wrapper
│   ├── cycles.ts                    # Cycle window math + reminder rules
│   ├── reminders.ts                 # Reminder log dedup
│   ├── excel.ts                     # exceljs parser (header-aliased)
│   ├── email.ts                     # nodemailer transport + templates
│   ├── seed.ts                      # Seeds ONLY the super-admin
│   └── engine/
│       ├── failureAnalyzer.ts
│       ├── resilience.ts
│       ├── leadership.ts
│       ├── roleMatcher.ts           # Cosine similarity, 10 roles
│       ├── explainability.ts
│       ├── ethics.ts                # PASSIONIT + PRUTL
│       └── runAnalysis.ts           # Orchestrator: records → suggestions
└── prisma/schema.prisma             # 17 models (multi-tenant)
```

---

## 🧠 Core Algorithms

1. **Failure Pattern Analysis** — Weighted scoring (severity × category_weight × recency)
2. **Resilience Index** — 4-factor composite: recovery speed, outcome improvement, severity tolerance, soft-skill buffer
3. **Role Re-Matching** — Cosine similarity between employee skill vectors and 10 role requirement vectors
4. **Leadership Potential** — Extracted from conflict resolution, high-severity recovery, and strategic strengths
5. **Emotional Recovery** — Exponential decay model measuring impact diminishment over time
6. **Transformational Learning** — Improvement rate + recovery speed trend analysis
7. **Explainability** — SHAP-like feature importance with human-readable explanations

All algorithms are pure math (no scikit-learn / numpy required) and live in `lib/engine/` as TypeScript.

---

## 🛡️ Ethical Frameworks

### PASSIONIT (9 dimensions)
Purpose · Accountability · Safety · Sustainability · Inclusivity · Objectivity · Non-bias · Integrity · Transparency

### PRUTL (5 dimensions)
Privacy · Reliability · Usability · Trustworthiness · Legality

Each dimension scored 1–10 with risk levels (Low/Medium/High). No demographic data is used in any analysis.

---

## 🛠️ Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**, **TypeScript 5**
- **Tailwind CSS v4** (custom theme + component classes in `app/globals.css`)
- **Prisma 5** + **PostgreSQL**
- **bcryptjs** + HMAC-signed cookies for auth
- **exceljs** for `.xlsx` parsing (chosen over `xlsx` for security)
- **nodemailer** for SMTP invitations
- **Lucide** icons, **Recharts** charts

---

## 📚 Legacy

The original Python (FastAPI + SQLAlchemy) backend and Vite + React frontend have been ported in full to TypeScript and removed from `main`. They remain accessible:

- Branch: [`legacy/fastapi-react`](https://github.com/Aryan-A-Sonawane/DL_CP/tree/legacy/fastapi-react)
- Tag: `v1-fastapi-react`

```bash
git checkout legacy/fastapi-react   # browse old code
git show v1-fastapi-react:backend/main.py   # peek at any old file
```
