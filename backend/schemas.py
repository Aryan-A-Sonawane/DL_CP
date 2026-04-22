"""Pydantic schemas for request/response serialization."""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ── Employee ────────────────────────────────────
class StrengthOut(BaseModel):
    id: int
    name: str
    score: float
    source: str
    class Config:
        from_attributes = True


class FailureEventOut(BaseModel):
    id: int
    category: str
    description: Optional[str] = None
    severity: float
    date: datetime
    recovery_time_days: int
    outcome_after: str
    class Config:
        from_attributes = True


class EmployeeListItem(BaseModel):
    id: int
    emp_code: str
    name: str
    primary_domain: str
    department: Optional[str] = None
    years_experience: float
    soft_skill_score: float
    repeated_failure_area: Optional[str] = None
    top_strengths: List[str] = []
    class Config:
        from_attributes = True


class EmployeeDetail(BaseModel):
    id: int
    emp_code: str
    name: str
    email: Optional[str] = None
    primary_domain: str
    department: Optional[str] = None
    years_experience: float
    soft_skill_score: float
    failure_events: List[FailureEventOut] = []
    strengths: List[StrengthOut] = []
    class Config:
        from_attributes = True


# ── Analysis ────────────────────────────────────
class AnalyzeRequest(BaseModel):
    employee_id: int


class SuggestedRole(BaseModel):
    role: str
    match_score: float
    explanation: str


class AnalysisResult(BaseModel):
    employee_id: int
    employee_name: str
    failure_score: float
    resilience_index: float
    leadership_score: float
    growth_trajectory: str
    transformational_learning_score: float
    emotional_recovery_score: float
    suggested_roles: List[SuggestedRole]
    feature_importance: dict
    disclaimer: str


# ── Dashboard ───────────────────────────────────
class MisalignmentStats(BaseModel):
    high: int
    moderate: int
    low: int
    total_employees: int


class TopTransition(BaseModel):
    from_domain: str
    to_role: str
    success_pct: float
    count: int


class DashboardStats(BaseModel):
    misalignment: MisalignmentStats
    top_transitions: List[TopTransition]
    avg_resilience: float
    avg_failure_score: float
    avg_leadership: float
    failure_category_distribution: dict


# ── Ethical Audit ───────────────────────────────
class AuditRequest(BaseModel):
    suggestion_id: int


class AuditDimension(BaseModel):
    dimension: str
    score: float
    risk_level: str
    notes: str


class AuditReport(BaseModel):
    suggestion_id: int
    employee_name: str
    suggested_role: str
    passionit: List[AuditDimension]
    prutl: List[AuditDimension]
    overall_risk: str
    overall_score: float
    disclaimer: str
