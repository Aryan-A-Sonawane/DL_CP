"""Employee CRUD routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from collections import Counter

from database import get_db
from models import Employee, FailureEvent, Strength
from schemas import EmployeeListItem, EmployeeDetail

router = APIRouter(prefix="/api/employees", tags=["employees"])


@router.get("", response_model=List[EmployeeListItem])
def list_employees(
    search: Optional[str] = None,
    domain: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Employee)
    if search:
        query = query.filter(Employee.name.ilike(f"%{search}%"))
    if domain:
        query = query.filter(Employee.primary_domain.ilike(f"%{domain}%"))

    employees = query.order_by(Employee.id).all()
    results = []
    for emp in employees:
        # Compute repeated failure area
        failure_cats = [fe.category for fe in emp.failure_events]
        repeated = "None"
        if failure_cats:
            counts = Counter(failure_cats)
            repeated = counts.most_common(1)[0][0].replace("_", " ").title()

        top_strengths = sorted(emp.strengths, key=lambda s: s.score, reverse=True)[:3]

        results.append(EmployeeListItem(
            id=emp.id,
            emp_code=emp.emp_code,
            name=emp.name,
            primary_domain=emp.primary_domain,
            department=emp.department,
            years_experience=emp.years_experience,
            soft_skill_score=emp.soft_skill_score,
            repeated_failure_area=repeated,
            top_strengths=[s.name for s in top_strengths],
        ))
    return results


@router.get("/{employee_id}", response_model=EmployeeDetail)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp
