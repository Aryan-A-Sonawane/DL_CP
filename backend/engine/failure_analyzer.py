"""Failure Pattern Analysis Engine — categorizes & scores failure patterns."""
from typing import List, Dict, Tuple
from collections import Counter
import math


# Category weights — higher = more impactful on misalignment
CATEGORY_WEIGHTS = {
    "deadline_miss": 0.6,
    "quality_issue": 0.8,
    "communication": 0.4,
    "team_conflict": 0.7,
    "budget_overrun": 0.65,
    "stakeholder_rejection": 0.5,
    "system_outage": 0.85,
    "process_failure": 0.55,
    "model_accuracy": 0.7,
    "campaign_failure": 0.6,
    "data_misinterpretation": 0.65,
    "target_miss": 0.7,
    "client_loss": 0.75,
}


def compute_failure_score(failure_events: List[dict]) -> float:
    """
    Weighted failure score (0–100).
    Factors: severity, frequency, category weight, recency.
    Higher = more misaligned in current role.
    """
    if not failure_events:
        return 0.0

    total = 0.0
    for evt in failure_events:
        cat_weight = CATEGORY_WEIGHTS.get(evt["category"], 0.5)
        severity = evt.get("severity", 5.0)
        # Recency boost: more recent failures weigh more
        recency = 1.0  # default
        total += severity * cat_weight * recency

    max_possible = len(failure_events) * 10.0 * 1.0  # max severity * max weight * recency
    raw = (total / max_possible) * 100 if max_possible > 0 else 0
    return round(min(raw, 100.0), 1)


def get_repeated_failure_area(failure_events: List[dict]) -> str:
    """Most frequent failure category."""
    if not failure_events:
        return "None"
    counts = Counter(evt["category"] for evt in failure_events)
    top = counts.most_common(1)[0]
    return top[0].replace("_", " ").title()


def compute_growth_trajectory(failure_events: List[dict]) -> str:
    """
    Growth After Setback Tracking — checks if outcomes trend positive.
    Returns: 'ascending' | 'stable' | 'descending'
    """
    if not failure_events:
        return "stable"
    outcomes = [evt.get("outcome_after", "neutral") for evt in failure_events]
    score_map = {"improved": 1, "neutral": 0, "declined": -1}
    scores = [score_map.get(o, 0) for o in outcomes]
    if len(scores) < 2:
        return "stable"
    # Simple trend: compare second half avg to first half avg
    mid = len(scores) // 2
    first_half = sum(scores[:mid]) / max(mid, 1)
    second_half = sum(scores[mid:]) / max(len(scores) - mid, 1)
    diff = second_half - first_half
    if diff > 0.3:
        return "ascending"
    elif diff < -0.3:
        return "descending"
    return "stable"


def get_failure_category_distribution(failure_events: List[dict]) -> Dict[str, int]:
    """Counts per category across all events."""
    counts = Counter(evt["category"] for evt in failure_events)
    return {k.replace("_", " ").title(): v for k, v in counts.most_common()}


def compute_transformational_learning_score(failure_events: List[dict]) -> float:
    """
    Measures how much an employee learns & transforms from failures.
    Based on improvement rate and recovery speed trend.
    Scale: 0–10.
    """
    if not failure_events:
        return 5.0
    improved_count = sum(1 for e in failure_events if e.get("outcome_after") == "improved")
    improvement_rate = improved_count / len(failure_events)

    # Recovery speed improvement
    recovery_times = [e.get("recovery_time_days", 30) for e in failure_events]
    if len(recovery_times) >= 2:
        first_avg = sum(recovery_times[:len(recovery_times)//2]) / max(len(recovery_times)//2, 1)
        second_avg = sum(recovery_times[len(recovery_times)//2:]) / max(len(recovery_times) - len(recovery_times)//2, 1)
        speed_improvement = max(0, (first_avg - second_avg) / max(first_avg, 1))
    else:
        speed_improvement = 0

    score = (improvement_rate * 6) + (speed_improvement * 4)
    return round(min(max(score, 0), 10), 1)
