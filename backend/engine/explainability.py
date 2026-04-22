"""Explainability Engine — feature importance for each recommendation."""
from typing import List, Dict


def generate_feature_importance(
    failure_events: List[dict],
    strengths: List[dict],
    resilience_index: float,
    soft_skill_score: float,
    leadership_score: float,
) -> Dict[str, float]:
    """
    SHAP-like feature importance breakdown.
    Shows contribution of each factor to the recommendation.
    Values are normalized to sum to 100%.
    """
    raw = {}

    # Strength contributions
    total_strength = sum(s["score"] for s in strengths) if strengths else 1
    for s in strengths:
        raw[f"Strength: {s['name']}"] = (s["score"] / total_strength) * 30

    # Failure-derived signals
    if failure_events:
        improved = sum(1 for e in failure_events if e.get("outcome_after") == "improved")
        raw["Recovery Pattern"] = (improved / len(failure_events)) * 20
        raw["Failure Frequency"] = min(len(failure_events) * 3, 15)
    else:
        raw["No Failure Data"] = 5

    # Composite scores
    raw["Resilience Index"] = (resilience_index / 100) * 15
    raw["Soft Skills"] = (soft_skill_score / 10) * 10
    raw["Leadership Potential"] = (leadership_score / 100) * 10

    # Normalize to sum to 100
    total = sum(raw.values())
    if total > 0:
        raw = {k: round(v / total * 100, 1) for k, v in raw.items()}

    # Sort by importance
    return dict(sorted(raw.items(), key=lambda x: x[1], reverse=True))


def generate_explanation_text(
    employee_name: str,
    suggested_role: str,
    match_score: float,
    failure_events: List[dict],
    strengths: List[dict],
    resilience_index: float,
    leadership_score: float,
) -> str:
    """Human-readable explanation for a role recommendation."""
    top_strengths = sorted(strengths, key=lambda s: s["score"], reverse=True)[:3]
    strength_names = [s["name"] for s in top_strengths]

    improved_failures = [e for e in failure_events if e.get("outcome_after") == "improved"]

    parts = [
        f"Based on comprehensive analysis, {employee_name} shows a {match_score}% alignment "
        f"with the {suggested_role} role.",
        "",
        f"Key strengths driving this recommendation: {', '.join(strength_names)}.",
    ]

    if improved_failures:
        categories = list(set(e["category"].replace("_", " ").title() for e in improved_failures))
        parts.append(
            f"Notably, {employee_name} demonstrated strong recovery after setbacks in "
            f"{', '.join(categories[:3])}, suggesting resilience and adaptability."
        )

    if resilience_index > 70:
        parts.append(f"With a resilience index of {resilience_index}, this employee shows exceptional "
                     f"ability to handle challenges inherent in the {suggested_role} role.")
    elif resilience_index > 40:
        parts.append(f"A moderate resilience index of {resilience_index} suggests steady ability to "
                     f"handle role transitions with appropriate support.")

    if leadership_score > 60:
        parts.append(f"Leadership potential score of {leadership_score} indicates readiness for "
                     f"people-management components of this role.")

    parts.append("")
    parts.append("⚠️ DISCLAIMER: This recommendation is AI-generated and should be used as one "
                 "data point among many in career development discussions. No demographic data "
                 "was used in this analysis. Final decisions should involve the employee, their "
                 "manager, and HR professionals.")

    return " ".join(parts)
