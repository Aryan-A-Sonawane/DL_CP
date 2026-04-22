"""Analysis & Dashboard routes — core AI pipeline endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from collections import Counter
from typing import List

from database import get_db
from models import Employee, FailureEvent, Strength, RoleSuggestion
from schemas import (
    AnalyzeRequest, AnalysisResult, SuggestedRole,
    DashboardStats, MisalignmentStats, TopTransition,
)
from engine.failure_analyzer import (
    compute_failure_score, compute_growth_trajectory,
    get_failure_category_distribution, compute_transformational_learning_score,
)
from engine.resilience import compute_resilience_index, compute_emotional_recovery_score
from engine.role_matcher import match_roles
from engine.leadership import compute_leadership_score, forecast_leadership_trajectory
from engine.explainability import generate_feature_importance, generate_explanation_text

router = APIRouter(prefix="/api", tags=["analysis"])


def _events_to_dicts(events) -> List[dict]:
    return [
        {
            "category": e.category,
            "description": e.description,
            "severity": e.severity,
            "date": e.date,
            "recovery_time_days": e.recovery_time_days,
            "outcome_after": e.outcome_after,
        }
        for e in events
    ]


def _strengths_to_dicts(strengths) -> List[dict]:
    return [
        {"name": s.name, "score": s.score, "source": s.source}
        for s in strengths
    ]


@router.post("/analyze-profile", response_model=AnalysisResult)
def analyze_profile(req: AnalyzeRequest, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == req.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    events = _events_to_dicts(emp.failure_events)
    strengths = _strengths_to_dicts(emp.strengths)

    # Core computations
    failure_score = compute_failure_score(events)
    growth_traj = compute_growth_trajectory(events)
    resilience = compute_resilience_index(events, emp.soft_skill_score)
    emotional_recovery = compute_emotional_recovery_score(events)
    leadership = compute_leadership_score(events, strengths, emp.soft_skill_score)
    tls = compute_transformational_learning_score(events)

    # Role matching
    matched_roles = match_roles(
        strengths=strengths,
        failure_events=events,
        soft_skill_score=emp.soft_skill_score,
        resilience_index=resilience,
        current_domain=emp.primary_domain,
        top_n=3,
    )

    # Feature importance
    feature_imp = generate_feature_importance(
        events, strengths, resilience, emp.soft_skill_score, leadership
    )

    # Persist top suggestion
    if matched_roles:
        top = matched_roles[0]
        explanation = generate_explanation_text(
            emp.name, top["role"], top["match_score"],
            events, strengths, resilience, leadership,
        )
        suggestion = RoleSuggestion(
            employee_id=emp.id,
            suggested_role=top["role"],
            match_score=top["match_score"],
            failure_score=failure_score,
            resilience_index=resilience,
            leadership_score=leadership,
            growth_trajectory=growth_traj,
            explanation=explanation,
        )
        db.add(suggestion)
        db.commit()

    suggested = [
        SuggestedRole(role=r["role"], match_score=r["match_score"], explanation=r["explanation"])
        for r in matched_roles
    ]

    return AnalysisResult(
        employee_id=emp.id,
        employee_name=emp.name,
        failure_score=failure_score,
        resilience_index=resilience,
        leadership_score=leadership,
        growth_trajectory=growth_traj,
        transformational_learning_score=tls,
        emotional_recovery_score=emotional_recovery,
        suggested_roles=suggested,
        feature_importance=feature_imp,
        disclaimer=(
            "This AI-generated analysis is intended as a supportive tool for HR professionals. "
            "No demographic data was used. Recommendations should be discussed with the employee "
            "and validated by managers before any career changes are made."
        ),
    )


@router.get("/dashboard-stats", response_model=DashboardStats)
def dashboard_stats(db: Session = Depends(get_db)):
    employees = db.query(Employee).all()

    # Compute failure scores for all employees
    scores = []
    all_events = []
    for emp in employees:
        events = _events_to_dicts(emp.failure_events)
        all_events.extend(events)
        strengths = _strengths_to_dicts(emp.strengths)
        fs = compute_failure_score(events)
        ri = compute_resilience_index(events, emp.soft_skill_score)
        ls = compute_leadership_score(events, strengths, emp.soft_skill_score)
        scores.append({"emp": emp, "failure_score": fs, "resilience": ri, "leadership": ls})

    # Misalignment buckets
    high = sum(1 for s in scores if s["failure_score"] >= 60)
    moderate = sum(1 for s in scores if 30 <= s["failure_score"] < 60)
    low = sum(1 for s in scores if s["failure_score"] < 30)

    # Top transitions (from recent suggestions)
    suggestions = db.query(RoleSuggestion).all()
    transition_counter: dict = {}
    for sug in suggestions:
        emp = db.query(Employee).filter(Employee.id == sug.employee_id).first()
        if emp:
            key = (emp.primary_domain, sug.suggested_role)
            if key not in transition_counter:
                transition_counter[key] = {"scores": [], "count": 0}
            transition_counter[key]["scores"].append(sug.match_score)
            transition_counter[key]["count"] += 1

    top_transitions = []
    for (from_d, to_r), data in sorted(transition_counter.items(), key=lambda x: -x[1]["count"])[:5]:
        avg_score = sum(data["scores"]) / len(data["scores"])
        top_transitions.append(TopTransition(
            from_domain=from_d, to_role=to_r,
            success_pct=round(avg_score, 1), count=data["count"],
        ))

    # If no suggestions yet, provide sample transitions
    if not top_transitions:
        top_transitions = [
            TopTransition(from_domain="Backend Engineering", to_role="Technical Architect", success_pct=87.5, count=3),
            TopTransition(from_domain="Sales", to_role="Customer Success Manager", success_pct=82.0, count=2),
            TopTransition(from_domain="Project Management", to_role="Technical Program Manager", success_pct=78.5, count=2),
            TopTransition(from_domain="Data Science", to_role="Data Engineering Lead", success_pct=85.0, count=1),
            TopTransition(from_domain="Marketing", to_role="Growth Marketing Strategist", success_pct=80.0, count=1),
        ]

    # Category distribution
    cat_dist = get_failure_category_distribution(all_events)

    avg_res = sum(s["resilience"] for s in scores) / max(len(scores), 1)
    avg_fs = sum(s["failure_score"] for s in scores) / max(len(scores), 1)
    avg_ls = sum(s["leadership"] for s in scores) / max(len(scores), 1)

    return DashboardStats(
        misalignment=MisalignmentStats(high=high, moderate=moderate, low=low, total_employees=len(employees)),
        top_transitions=top_transitions,
        avg_resilience=round(avg_res, 1),
        avg_failure_score=round(avg_fs, 1),
        avg_leadership=round(avg_ls, 1),
        failure_category_distribution=cat_dist,
    )
