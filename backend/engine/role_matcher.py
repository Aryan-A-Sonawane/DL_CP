"""Role Re-Matching Algorithm — vector similarity between employee profile and role requirements."""
from typing import List, Dict, Tuple
import math

# ── Role Definitions (requirement vectors) ──────────────────────────
# Each role has required skills/attributes scored 0-10
ROLE_DEFINITIONS: Dict[str, Dict[str, float]] = {
    "Technical Architect": {
        "problem_solving": 9, "system_thinking": 9, "deep_technical_knowledge": 8,
        "architecture_design": 9, "communication": 6, "creativity": 5,
        "leadership": 5, "empathy": 4, "crisis_management": 6,
    },
    "Engineering Manager": {
        "problem_solving": 7, "communication": 8, "leadership": 9,
        "empathy": 8, "team_conflict_resolution": 9, "strategic_vision": 7,
        "stakeholder_management": 8, "adaptability": 7, "crisis_management": 6,
    },
    "Data Engineering Lead": {
        "analytical_thinking": 9, "system_thinking": 8, "automation_mindset": 8,
        "problem_solving": 8, "deep_technical_knowledge": 7, "process_improvement": 7,
        "communication": 6, "attention_to_detail": 8, "crisis_management": 5,
    },
    "Product Strategist": {
        "strategic_vision": 9, "visionary_thinking": 9, "stakeholder_management": 8,
        "communication": 8, "empathy": 7, "analytical_thinking": 7,
        "creativity": 7, "cross_functional_leadership": 8, "adaptability": 7,
    },
    "UX Research Lead": {
        "user_empathy": 9, "creativity": 8, "analytical_thinking": 7,
        "communication": 8, "storytelling_with_data": 8, "visual_communication": 7,
        "adaptability": 7, "empathy": 8, "attention_to_detail": 7,
    },
    "Customer Success Manager": {
        "empathy": 9, "relationship_building": 9, "active_listening": 8,
        "communication": 9, "problem_solving": 6, "persuasion": 7,
        "adaptability": 8, "crisis_management": 6, "trend_analysis": 5,
    },
    "DevOps Architect": {
        "automation_mindset": 9, "crisis_management": 9, "system_thinking": 8,
        "deep_technical_knowledge": 8, "quick_recovery": 8, "process_improvement": 8,
        "problem_solving": 8, "attention_to_detail": 7, "communication": 5,
    },
    "Technical Program Manager": {
        "strategic_vision": 8, "stakeholder_management": 9, "risk_assessment": 8,
        "communication": 8, "leadership": 7, "process_improvement": 7,
        "cross_functional_leadership": 8, "adaptability": 7, "empathy": 6,
    },
    "Growth Marketing Strategist": {
        "creativity": 9, "trend_analysis": 9, "persuasion": 8,
        "analytical_thinking": 7, "storytelling_with_data": 8, "communication": 8,
        "adaptability": 7, "strategic_vision": 6, "empathy": 5,
    },
    "Site Reliability Engineer": {
        "crisis_management": 9, "automation_mindset": 8, "deep_technical_knowledge": 8,
        "quick_recovery": 9, "system_thinking": 8, "attention_to_detail": 8,
        "process_improvement": 7, "problem_solving": 8, "communication": 5,
    },
}


def _normalize_key(name: str) -> str:
    """Normalize a strength/skill name to dict key format."""
    return name.lower().replace(" ", "_").replace("-", "_")


def _build_employee_vector(strengths: List[dict], soft_skill_score: float,
                           failure_events: List[dict]) -> Dict[str, float]:
    """Build an attribute vector for the employee from their strengths and signals."""
    vec: Dict[str, float] = {}

    # Direct strengths
    for s in strengths:
        key = _normalize_key(s["name"])
        vec[key] = s["score"]

    # Inferred attributes from failure patterns
    failure_categories = [e["category"] for e in failure_events]
    outcomes = [e.get("outcome_after", "neutral") for e in failure_events]

    # If they failed at team_conflict but improved → strong conflict resolution
    for i, cat in enumerate(failure_categories):
        if cat == "team_conflict" and outcomes[i] == "improved":
            vec["team_conflict_resolution"] = vec.get("team_conflict_resolution", 0) + 3
        if cat == "system_outage" and outcomes[i] == "improved":
            vec["crisis_management"] = vec.get("crisis_management", 0) + 3
            vec["quick_recovery"] = vec.get("quick_recovery", 0) + 2

    # Soft-skill score maps to communication & empathy baseline
    vec.setdefault("communication", soft_skill_score * 0.8)
    vec.setdefault("empathy", soft_skill_score * 0.7)
    vec.setdefault("adaptability", soft_skill_score * 0.6)

    # Cap all values at 10
    return {k: min(v, 10.0) for k, v in vec.items()}


def _cosine_similarity(a: Dict[str, float], b: Dict[str, float]) -> float:
    """Cosine similarity between two sparse vectors."""
    all_keys = set(a.keys()) | set(b.keys())
    dot = sum(a.get(k, 0) * b.get(k, 0) for k in all_keys)
    mag_a = math.sqrt(sum(v ** 2 for v in a.values()))
    mag_b = math.sqrt(sum(v ** 2 for v in b.values()))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def match_roles(
    strengths: List[dict],
    failure_events: List[dict],
    soft_skill_score: float,
    resilience_index: float,
    current_domain: str,
    top_n: int = 3,
) -> List[Dict]:
    """
    Role Re-Matching Algorithm.
    
    Returns top N roles with match_score (0-100) and explanation.
    Incorporates resilience as a bonus for high-demand roles.
    """
    emp_vec = _build_employee_vector(strengths, soft_skill_score, failure_events)

    results = []
    for role_name, role_vec in ROLE_DEFINITIONS.items():
        sim = _cosine_similarity(emp_vec, role_vec)

        # Resilience bonus for roles that need crisis handling
        resilience_bonus = 0
        if role_vec.get("crisis_management", 0) >= 7 and resilience_index > 60:
            resilience_bonus = 5
        if role_vec.get("leadership", 0) >= 7 and resilience_index > 70:
            resilience_bonus += 3

        match_score = round(sim * 100 + resilience_bonus, 1)
        match_score = min(match_score, 99.5)  # never 100 — ethical honesty

        # Generate explanation
        matching_attrs = []
        for k in role_vec:
            if k in emp_vec and emp_vec[k] >= role_vec[k] * 0.7:
                matching_attrs.append(k.replace("_", " ").title())

        explanation = (
            f"Strong alignment based on: {', '.join(matching_attrs[:5])}. "
            f"Resilience index ({resilience_index}) indicates "
            f"{'excellent' if resilience_index > 70 else 'moderate' if resilience_index > 40 else 'developing'} "
            f"ability to handle role challenges."
        )

        results.append({
            "role": role_name,
            "match_score": match_score,
            "explanation": explanation,
        })

    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results[:top_n]
