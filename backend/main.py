"""Failure-to-Role Mapping Platform — FastAPI Application."""
import os
import sys

# Ensure the backend directory is on the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, SessionLocal, Base
from models import Employee, FailureEvent, Strength
from seed_data import get_seed_employees, get_seed_failure_events, get_seed_strengths


def seed_database():
    """Seed the database with sample data if empty."""
    db = SessionLocal()
    try:
        if db.query(Employee).count() > 0:
            return  # Already seeded

        # Create employees
        emp_data = get_seed_employees()
        employees = []
        for data in emp_data:
            emp = Employee(**data)
            db.add(emp)
            employees.append(emp)
        db.flush()

        # Create failure events
        for emp_idx, events in get_seed_failure_events():
            emp = employees[emp_idx - 1]
            for evt in events:
                db.add(FailureEvent(employee_id=emp.id, **evt))

        # Create strengths
        for emp_idx, strengths in get_seed_strengths():
            emp = employees[emp_idx - 1]
            for s in strengths:
                db.add(Strength(employee_id=emp.id, **s))

        db.commit()
        print(f"✅ Seeded {len(employees)} employees with failure events and strengths")
    except Exception as e:
        db.rollback()
        print(f"❌ Seed error: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield
    # Shutdown — nothing to clean up for SQLite


app = FastAPI(
    title="Failure-to-Role Mapping Platform",
    description=(
        "Ethical AI system that analyzes employee performance failure patterns, "
        "extracts hidden strengths & resilience signals, and recommends better-aligned "
        "roles with high explainability and bias mitigation."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
from routes.employees import router as emp_router
from routes.analysis import router as analysis_router
from routes.audit import router as audit_router

app.include_router(emp_router)
app.include_router(analysis_router)
app.include_router(audit_router)


@app.get("/")
def root():
    return {
        "name": "Failure-to-Role Mapping Platform",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "ethical_frameworks": ["PASSIONIT", "PRUTL"],
    }
