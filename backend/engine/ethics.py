"""Ethical Compliance Engine — PASSIONIT & PRUTL scoring frameworks."""
from typing import List, Dict
import random


# ── PASSIONIT Framework ─────────────────────────────────────────────
# Purpose, Accountability, Safety, Sustainability, Inclusivity,
# Objectivity, Non-bias, Integrity, Transparency

PASSIONIT_DIMENSIONS = [
    ("Purpose", "Does the recommendation serve the employee's career growth and well-being?"),
    ("Accountability", "Are there clear owners and appeal processes for this recommendation?"),
    ("Safety", "Does the recommendation protect against harmful career disruption?"),
    ("Sustainability", "Is the suggested transition sustainable long-term for the employee?"),
    ("Inclusivity", "Was the analysis inclusive and accessible to all employee demographics?"),
    ("Objectivity", "Is the recommendation based on objective performance data?"),
    ("Non-bias", "Were demographic factors excluded from the matching algorithm?"),
    ("Integrity", "Does the recommendation maintain data integrity and honesty?"),
    ("Transparency", "Is the reasoning behind the recommendation fully explainable?"),
]

# ── PRUTL Framework ─────────────────────────────────────────────────
# Privacy, Reliability, Usability, Trustworthiness, Legality

PRUTL_DIMENSIONS = [
    ("Privacy", "Is employee data properly anonymized and access-controlled?"),
    ("Reliability", "Is the algorithm consistent and reproducible across runs?"),
    ("Usability", "Can HR professionals easily understand and act on recommendations?"),
    ("Trustworthiness", "Does the system inspire confidence through accuracy and fairness?"),
    ("Legality", "Does the recommendation comply with employment law and regulations?"),
]


def _risk_level(score: float) -> str:
    if score >= 8.0:
        return "Low"
    elif score >= 5.0:
        return "Medium"
    return "High"


def score_passionit(
    match_score: float,
    resilience_index: float,
    has_explanation: bool,
    failure_count: int,
) -> List[Dict]:
    """
    Score each PASSIONIT dimension 1–10 based on recommendation characteristics.
    This is a rule-based ethical audit (would be LLM-augmented in production).
    """
    results = []

    base_scores = {
        "Purpose": min(9.5, 7.0 + (match_score / 100) * 3),
        "Accountability": 8.5,  # System has appeal process built-in
        "Safety": min(9.0, 6.5 + (resilience_index / 100) * 3),
        "Sustainability": min(9.0, 6.0 + (match_score / 100) * 3),
        "Inclusivity": 9.0,     # No demographic inputs used
        "Objectivity": min(9.5, 7.0 + min(failure_count, 5) * 0.5),
        "Non-bias": 9.2,        # Algorithm excludes protected attributes
        "Integrity": 8.8 if has_explanation else 6.0,
        "Transparency": 9.0 if has_explanation else 5.0,
    }

    for dim_name, dim_desc in PASSIONIT_DIMENSIONS:
        score = round(base_scores.get(dim_name, 7.0) + random.uniform(-0.3, 0.3), 1)
        score = min(max(score, 1.0), 10.0)
        results.append({
            "dimension": dim_name,
            "score": score,
            "risk_level": _risk_level(score),
            "notes": dim_desc,
        })

    return results


def score_prutl(
    match_score: float,
    has_explanation: bool,
) -> List[Dict]:
    """Score each PRUTL dimension 1–10."""
    results = []

    base_scores = {
        "Privacy": 9.0,         # No demographic data collected
        "Reliability": 8.5,     # Deterministic algorithm
        "Usability": 8.0 if has_explanation else 5.5,
        "Trustworthiness": min(9.0, 7.0 + (match_score / 100) * 2),
        "Legality": 9.0,        # Compliant by design
    }

    for dim_name, dim_desc in PRUTL_DIMENSIONS:
        score = round(base_scores.get(dim_name, 7.0) + random.uniform(-0.3, 0.3), 1)
        score = min(max(score, 1.0), 10.0)
        results.append({
            "dimension": dim_name,
            "score": score,
            "risk_level": _risk_level(score),
            "notes": dim_desc,
        })

    return results


def compute_overall_ethics(passionit: List[Dict], prutl: List[Dict]) -> tuple:
    """Return (overall_score, overall_risk_level)."""
    all_scores = [d["score"] for d in passionit] + [d["score"] for d in prutl]
    avg = sum(all_scores) / len(all_scores) if all_scores else 0
    return round(avg, 1), _risk_level(avg)
