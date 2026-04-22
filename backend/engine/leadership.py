"""Leadership Potential Extraction & Long-Term Forecasting."""
from typing import List, Dict


def compute_leadership_score(
    failure_events: List[dict],
    strengths: List[dict],
    soft_skill_score: float,
) -> float:
    """
    Leadership Potential Extraction.
    
    Signals:
    - Team conflict failures that resulted in improvement → conflict resolution
    - High soft skills → people management potential
    - Strategic/visionary strengths
    - Recovery from high-severity failures → resilience under pressure
    
    Scale: 0–100
    """
    score = 0.0

    # 1. Conflict resolution from failures (0-25)
    team_failures = [e for e in failure_events if e["category"] in ("team_conflict", "communication")]
    if team_failures:
        resolved = sum(1 for e in team_failures if e.get("outcome_after") == "improved")
        score += (resolved / len(team_failures)) * 25

    # 2. High-severity recovery (0-20)
    high_sev = [e for e in failure_events if e.get("severity", 0) >= 7]
    if high_sev:
        recovered = sum(1 for e in high_sev if e.get("outcome_after") == "improved")
        score += (recovered / len(high_sev)) * 20

    # 3. Soft skill score (0-25)
    score += (soft_skill_score / 10) * 25

    # 4. Strategic strengths (0-30)
    leadership_strengths = {
        "strategic_vision", "visionary_thinking", "cross_functional_leadership",
        "stakeholder_management", "empathy", "leadership", "relationship_building",
        "persuasion", "active_listening",
    }
    for s in strengths:
        key = s["name"].lower().replace(" ", "_").replace("-", "_")
        if key in leadership_strengths:
            score += (s["score"] / 10) * (30 / max(len(strengths), 1))

    return round(min(max(score, 0), 100), 1)


def forecast_leadership_trajectory(
    leadership_score: float,
    growth_trajectory: str,
    years_experience: float,
) -> Dict:
    """
    Long-Term Leadership Forecasting.
    
    Simple projection based on current score, growth trajectory, and experience.
    """
    trajectory_multiplier = {
        "ascending": 1.15,
        "stable": 1.0,
        "descending": 0.85,
    }.get(growth_trajectory, 1.0)

    experience_factor = min(years_experience / 10, 1.0)  # caps at 10yr

    # 1-year projection
    projected_1y = leadership_score * trajectory_multiplier * (1 + experience_factor * 0.1)
    # 3-year projection
    projected_3y = leadership_score * (trajectory_multiplier ** 3) * (1 + experience_factor * 0.25)

    readiness = "Not Ready"
    if projected_1y >= 70:
        readiness = "Ready Now"
    elif projected_1y >= 50:
        readiness = "Ready in 1-2 Years"
    elif projected_3y >= 60:
        readiness = "Ready in 3-5 Years"

    return {
        "current_score": leadership_score,
        "projected_1y": round(min(projected_1y, 100), 1),
        "projected_3y": round(min(projected_3y, 100), 1),
        "readiness": readiness,
        "growth_trajectory": growth_trajectory,
    }
