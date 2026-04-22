"""Resilience Index Computation & Emotional Recovery Modeling."""
from typing import List
import math


def compute_resilience_index(failure_events: List[dict], soft_skill_score: float = 5.0) -> float:
    """
    Composite resilience index (0–100).
    
    Factors:
    1. Recovery Speed — faster recovery = higher resilience
    2. Outcome Improvement Rate — bouncing back stronger
    3. Severity Tolerance — handling high-severity failures
    4. Soft-skill Buffer — higher soft skills improve resilience
    """
    if not failure_events:
        return 50.0  # neutral

    n = len(failure_events)

    # 1. Recovery speed score (0-25)
    recovery_times = [e.get("recovery_time_days", 30) for e in failure_events]
    avg_recovery = sum(recovery_times) / n
    # Normalize: <7 days = perfect, >60 days = 0
    recovery_score = max(0, 25 * (1 - (avg_recovery - 7) / 53))

    # 2. Outcome improvement rate (0-30)
    outcomes = [e.get("outcome_after", "neutral") for e in failure_events]
    improved = sum(1 for o in outcomes if o == "improved")
    outcome_score = (improved / n) * 30

    # 3. Severity tolerance (0-25)
    avg_severity = sum(e.get("severity", 5) for e in failure_events) / n
    # Higher severity handled = higher tolerance score
    severity_score = (avg_severity / 10) * 25

    # 4. Soft-skill buffer (0-20)
    soft_score = (soft_skill_score / 10) * 20

    total = recovery_score + outcome_score + severity_score + soft_score
    return round(min(max(total, 0), 100), 1)


def compute_emotional_recovery_score(failure_events: List[dict]) -> float:
    """
    Emotional Recovery Modeling — exponential decay model.
    
    Models how quickly emotional impact diminishes.
    Higher score = better emotional recovery.
    Scale: 0–10.
    """
    if not failure_events:
        return 5.0

    scores = []
    for evt in failure_events:
        severity = evt.get("severity", 5.0)
        recovery_days = evt.get("recovery_time_days", 30)
        outcome = evt.get("outcome_after", "neutral")

        # Decay rate: faster recovery = higher decay = better
        decay_rate = 1.0 / max(recovery_days, 1)

        # Emotional impact at day 30 (reference point)
        remaining_impact = severity * math.exp(-decay_rate * 30)

        # Outcome bonus
        outcome_bonus = {"improved": 2, "neutral": 0, "declined": -1}.get(outcome, 0)

        # Score: how well they recovered (low remaining impact = good)
        event_score = 10 - remaining_impact + outcome_bonus
        scores.append(max(0, min(10, event_score)))

    return round(sum(scores) / len(scores), 1)
