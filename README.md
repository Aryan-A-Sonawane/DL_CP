# Failure-to-Role Mapping Platform

> Ethical AI system that analyzes employee performance failure patterns, extracts hidden strengths & resilience signals, and recommends better-aligned roles with high explainability and bias mitigation.

![Tech Stack](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React_18-61DAFB?style=flat&logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)

---

## 🏗️ Architecture

```
DL_CP/
├── backend/
│   ├── main.py                # FastAPI app entrypoint
│   ├── database.py            # SQLAlchemy + SQLite config
│   ├── models.py              # ORM models (5 tables)
│   ├── schemas.py             # Pydantic request/response schemas
│   ├── seed_data.py           # 10 sample employees
│   ├── engine/
│   │   ├── failure_analyzer.py   # Failure pattern scoring
│   │   ├── resilience.py         # Resilience index + emotional recovery
│   │   ├── role_matcher.py       # Cosine-similarity role matching
│   │   ├── leadership.py         # Leadership extraction + forecasting
│   │   ├── explainability.py     # Feature importance + explanations
│   │   └── ethics.py             # PASSIONIT & PRUTL scoring
│   └── routes/
│       ├── employees.py       # GET /api/employees
│       ├── analysis.py        # POST /api/analyze-profile, GET /api/dashboard-stats
│       └── audit.py           # POST /api/ethical-audit, GET /api/suggestions
└── frontend/
    └── src/
        ├── App.jsx            # Sidebar + routing
        ├── api.js             # API client
        └── pages/
            ├── Dashboard.jsx  # Stats, charts, transitions
            ├── Masters.jsx    # Employee table
            ├── Transactions.jsx  # AI analysis per employee
            └── Reports.jsx    # PASSIONIT/PRUTL audit tables
```

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** and npm

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The database is auto-created and seeded with 10 sample employees on first run.

API docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

The Vite dev server proxies `/api` requests to the backend on port 8000.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | List employees (supports `?search=` query) |
| GET | `/api/employees/{id}` | Employee detail with failures & strengths |
| POST | `/api/analyze-profile` | Run AI analysis → failure score, roles, explainability |
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

---

## 🛡️ Ethical Frameworks

### PASSIONIT (9 dimensions)
Purpose · Accountability · Safety · Sustainability · Inclusivity · Objectivity · Non-bias · Integrity · Transparency

### PRUTL (5 dimensions)
Privacy · Reliability · Usability · Trustworthiness · Legality

Each dimension scored 1–10 with risk levels (Low/Medium/High). No demographic data is used in any analysis.

---

## 🔮 Extensibility

Designed for future additions:
- LLM fine-tuning for richer explanation generation
- Neo4j graph database for causal experience mapping
- Time-series recovery modeling
- AIF360 bias testing integration
- Multi-tenant authentication
