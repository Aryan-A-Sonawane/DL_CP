# Failure-to-Role Mapping Platform

> Ethical AI system that analyzes employee performance failure patterns, extracts hidden strengths & resilience signals, and recommends better-aligned roles with high explainability and bias mitigation.

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)

A unified Next.js 16 application — UI, scoring engine, ethics audit, and SQLite database all run in a single process. The original FastAPI + React + Vite implementation is preserved on the [`legacy/fastapi-react`](https://github.com/ansh-212/DL_CP/tree/legacy/fastapi-react) branch (tag `v1-fastapi-react`).

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 20.9+** and npm

```bash
npm install
npm run dev
```

`npm run dev` runs `prisma db push` (creates `prisma/dev.db`), seeds 10 sample employees if empty, then starts Next.js (Turbopack) on http://localhost:3000.

---

## 🏗️ Architecture

```
DL_CP/
├── app/
│   ├── layout.tsx                 # Top nav + global layout
│   ├── page.tsx                   # Dashboard
│   ├── masters/page.tsx           # People
│   ├── transactions/page.tsx      # Analyze
│   ├── reports/page.tsx           # Ethical audit
│   └── api/
│       ├── employees/route.ts
│       ├── employees/[id]/route.ts
│       ├── analyze-profile/route.ts
│       ├── dashboard-stats/route.ts
│       ├── ethical-audit/route.ts
│       └── suggestions/route.ts
├── components/
│   ├── TopNav.tsx
│   └── KnowledgeGraph.tsx
├── lib/
│   ├── db.ts                      # Prisma singleton
│   ├── api.ts                     # Client fetch helpers
│   ├── seed.ts                    # 10 sample employees
│   └── engine/
│       ├── failureAnalyzer.ts
│       ├── resilience.ts
│       ├── roleMatcher.ts         # Cosine similarity, 10 roles
│       ├── leadership.ts
│       ├── explainability.ts
│       └── ethics.ts              # PASSIONIT + PRUTL
└── prisma/schema.prisma           # 5 tables
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | List employees (supports `?search=` query) |
| GET | `/api/employees/[id]` | Employee detail with failures & strengths |
| POST | `/api/analyze-profile` | Run analysis → failure score, roles, explainability |
| GET | `/api/dashboard-stats` | Aggregate misalignment stats & transitions |
| POST | `/api/ethical-audit` | Generate PASSIONIT/PRUTL compliance report |
| GET | `/api/suggestions` | List all role suggestions |

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

- **Next.js 16** (App Router, Turbopack default)
- **React 19**
- **TypeScript 5**
- **Tailwind CSS v4**
- **Prisma 5** + **SQLite** (file-based, zero-config)
- **Lucide** icons, **Recharts** charts

---

## 🔮 Extensibility

Designed for future ML additions:
- Local embeddings via `@xenova/transformers` for semantic role matching
- LLM-generated coaching narratives via Vercel AI SDK
- K-means employee archetype clustering
- AIF360-style bias testing integration
- Multi-tenant authentication

---

## 📚 Legacy

The original Python (FastAPI + SQLAlchemy) backend and Vite + React frontend have been ported in full to TypeScript and removed from `main`. They remain accessible:

- Branch: [`legacy/fastapi-react`](https://github.com/ansh-212/DL_CP/tree/legacy/fastapi-react)
- Tag: `v1-fastapi-react`

```bash
git checkout legacy/fastapi-react   # browse old code
git show v1-fastapi-react:backend/main.py   # peek at any old file
```
