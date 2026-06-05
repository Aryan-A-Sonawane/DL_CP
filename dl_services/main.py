"""
dl_services/main.py
FastAPI microservice that loads the trained PyTorch models and exposes an
/analyze endpoint called by the Next.js backend after each Excel upload.

Start with:
    cd dl_services
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import json
import math
import os
import sys
import zipfile
from contextlib import asynccontextmanager
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ─── Paths ───────────────────────────────────────────────────────────────────
ROOT = Path(__file__).parent
CKPT_DIR = ROOT / "checkpoints"
MODEL_DIR = ROOT / "models"
METRICS_FILE = CKPT_DIR / "metrics.json"

sys.path.insert(0, str(ROOT))

from models.resilience_mlp import ResilienceMLP
from models.failure_lstm import FailureLSTM, TRAJECTORY_LABELS
from models.role_matcher import RoleMatcher, ROLE_NAMES

# ─── Global model registry ────────────────────────────────────────────────────
_models: dict[str, torch.nn.Module] = {}
_metrics: dict = {}


class _PydanticConfig:
    protected_namespaces = ()


def _load_zip_model(model: torch.nn.Module, zip_name: str) -> torch.nn.Module:
    """Load state_dict from a .pt.zip checkpoint (PyTorch zip format)."""
    zip_path = CKPT_DIR / zip_name
    if not zip_path.exists():
        raise FileNotFoundError(f"Checkpoint not found: {zip_path}")
    # torch.load handles the PyTorch zip format natively
    state = torch.load(str(zip_path), map_location="cpu", weights_only=False)
    model.load_state_dict(state)
    model.eval()
    return model


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Load models on startup ─────────────────────────────────────────────
    try:
        _models["resilience"] = _load_zip_model(ResilienceMLP(), "resilience_mlp.pt.zip")
        print("[OK] ResilienceMLP loaded")
    except Exception as e:
        print(f"[WARN] ResilienceMLP failed to load: {e}")

    try:
        _models["failure"] = _load_zip_model(FailureLSTM(), "failure_lstm.pt.zip")
        print("[OK] FailureLSTM loaded")
    except Exception as e:
        print(f"[WARN] FailureLSTM failed to load: {e}")

    try:
        _models["role"] = _load_zip_model(RoleMatcher(), "role_matcher.pt.zip")
        print("[OK] RoleMatcher loaded")
    except Exception as e:
        print(f"[WARN] RoleMatcher failed to load: {e}")

    if METRICS_FILE.exists():
        _metrics.update(json.loads(METRICS_FILE.read_text()))

    yield  # ── app runs ──────────────────────────────────────────────────

    _models.clear()


app = FastAPI(title="Failure Intelligence Mapper — DL Service", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # called server-to-server by the Next.js backend; CORS is moot
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "service": "Failure Intelligence Mapper — DL Service",
        "models": list(_models.keys()),
    }


@app.get("/health")
def health():
    # Healthy only when all three models loaded — used by host health checks.
    ready = {"resilience", "failure", "role"}.issubset(_models.keys())
    return {"status": "ok" if ready else "degraded", "models": list(_models.keys()), "metrics": _metrics}


# ─── Request / Response schemas ───────────────────────────────────────────────

class FailureEventPayload(BaseModel):
    category: str                          # e.g. "quality_issue"
    severity: float = 5.0
    recovery_time_days: int = 30
    outcome_after: str = "neutral"         # improved | neutral | declined
    days_ago: float = 0.0                  # days since event relative to analysis date


class StrengthPayload(BaseModel):
    name: str
    score: float


class AnalyzeRequest(BaseModel):
    # Raw performance metrics (from PerformanceRecord aggregation)
    hours_worked: float = Field(..., ge=0)
    hours_per_cycle: float = Field(40.0, ge=1)
    defects: int = Field(0, ge=0)
    defect_fix_hours: float = Field(0.0, ge=0)
    productivity_cycles: int = Field(1, ge=1)
    on_time: bool = True

    # User profile
    soft_skill_score: float = Field(5.0, ge=0, le=10)
    years_experience: float = Field(0.0, ge=0)

    # Engine-derived (from JS heuristics, used as additional signal)
    js_resilience: float = Field(50.0, ge=0, le=100)
    js_failure_score: float = Field(0.0, ge=0, le=100)
    js_leadership_score: float = Field(5.0, ge=0, le=10)

    # Historical failure events (latest 20 used for LSTM sequence)
    failure_events: list[FailureEventPayload] = Field(default_factory=list)

    # Employee strengths
    strengths: list[StrengthPayload] = Field(default_factory=list)

    # Lifecycle (optional enrichment)
    lifecycle: str | None = None


class RoleResult(BaseModel):
    role: str
    match_score: float
    rank: int


class AnalyzeResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    resilience_index: float
    failure_score: float
    growth_trajectory: str
    top_roles: list[RoleResult]
    model_versions: dict[str, str]


# ─── Feature engineering ──────────────────────────────────────────────────────

CATEGORY_WEIGHT: dict[str, float] = {
    "deadline_miss": 0.6, "quality_issue": 0.8, "communication": 0.4,
    "team_conflict": 0.7, "budget_overrun": 0.65, "stakeholder_rejection": 0.5,
    "system_outage": 0.85, "process_failure": 0.55, "model_accuracy": 0.7,
    "campaign_failure": 0.6, "data_misinterpretation": 0.65,
    "target_miss": 0.7, "client_loss": 0.75,
}

LIFECYCLE_IDX: dict[str, int] = {
    "Waterfall": 0, "Scrum": 1, "Kanban": 2, "SAFe": 3,
    "XP": 4, "DSDM": 5, "Crystal Clear": 6, "Spiral": 7,
}

STRENGTH_KEYS = [
    "problem_solving", "communication", "leadership", "empathy",
    "system_thinking", "creativity", "analytical_thinking", "crisis_management",
    "adaptability", "attention_to_detail",
]

FAILURE_CAT_KEYS = [
    "quality_issue", "deadline_miss", "process_failure",
    "team_conflict", "system_outage",
]


def _build_resilience_features(req: AnalyzeRequest) -> torch.Tensor:
    """Build the 12-feature vector for ResilienceMLP."""
    tat = req.defect_fix_hours / req.defects if req.defects > 0 else 0.0
    efficiency = req.hours_worked / (req.hours_per_cycle * req.productivity_cycles + 1e-6)

    num_failures = len(req.failure_events)
    improved = sum(1 for e in req.failure_events if e.outcome_after == "improved")
    improvement_rate = improved / max(num_failures, 1)

    recovery_times = [e.recovery_time_days for e in req.failure_events]
    if len(recovery_times) >= 2:
        half = len(recovery_times) // 2
        first_avg = sum(recovery_times[:half]) / max(half, 1)
        second_avg = sum(recovery_times[half:]) / max(len(recovery_times) - half, 1)
        recovery_speed = max(0.0, (first_avg - second_avg) / max(first_avg, 1.0))
    else:
        recovery_speed = 0.0

    lifecycle_idx = LIFECYCLE_IDX.get(req.lifecycle or "", 1)  # default Scrum=1
    lifecycle_scrum = 1.0 if lifecycle_idx == 1 else 0.0

    feats = [
        min(req.hours_worked / 200.0, 1.0),
        min(req.hours_per_cycle / 160.0, 1.0),
        min(req.defects / 30.0, 1.0),
        min(req.defect_fix_hours / 100.0, 1.0),
        min(tat / 20.0, 1.0),
        1.0 if req.on_time else 0.0,
        req.soft_skill_score / 10.0,
        min(num_failures / 10.0, 1.0),
        improvement_rate,
        min(recovery_speed, 1.0),
        min(req.productivity_cycles / 8.0, 1.0),
        lifecycle_scrum,
    ]
    return torch.tensor([feats], dtype=torch.float32)  # (1, 12)


def _build_lstm_sequence(req: AnalyzeRequest) -> torch.Tensor:
    """Build the (1, seq, 7) LSTM input from failure events."""
    events = req.failure_events[-20:]  # cap at 20
    if not events:
        # Single dummy timestep of zeros
        return torch.zeros(1, 1, 7, dtype=torch.float32)

    rows = []
    for e in events:
        cat_w = CATEGORY_WEIGHT.get(e.category, 0.5)
        rows.append([
            e.severity / 10.0,
            cat_w,
            min(e.recovery_time_days / 90.0, 1.0),
            1.0 if e.outcome_after == "improved" else 0.0,
            1.0 if e.outcome_after == "declined" else 0.0,
            0.0,  # tat_normalized (not per-event — filled with 0)
            min(e.days_ago / 365.0, 1.0),
        ])
    return torch.tensor([rows], dtype=torch.float32)  # (1, seq, 7)


def _build_role_features(req: AnalyzeRequest, resilience: float, failure_score: float) -> torch.Tensor:
    """Build the 36-feature employee tower vector for RoleMatcher."""
    tat = req.defect_fix_hours / req.defects if req.defects > 0 else 0.0
    efficiency = req.hours_worked / (req.hours_per_cycle * req.productivity_cycles + 1e-6)

    # Base 8 features
    base = [
        resilience / 100.0,
        failure_score / 100.0,
        req.js_leadership_score / 10.0,
        req.soft_skill_score / 10.0,
        min(req.years_experience / 20.0, 1.0),
        min(efficiency, 1.0),
        min(req.defects / 30.0, 1.0),
        min(tat / 20.0, 1.0),
    ]

    # 10 strength scores
    strength_map = {s.name.lower().replace(" ", "_"): s.score for s in req.strengths}
    strength_feats = [min(strength_map.get(k, req.soft_skill_score * 0.7) / 10.0, 1.0)
                      for k in STRENGTH_KEYS]

    # 8 lifecycle one-hot
    lc_idx = LIFECYCLE_IDX.get(req.lifecycle or "", -1)
    lifecycle_oh = [1.0 if i == lc_idx else 0.0 for i in range(8)]

    # 5 failure category flags
    active_cats = {e.category for e in req.failure_events}
    cat_flags = [1.0 if k in active_cats else 0.0 for k in FAILURE_CAT_KEYS]

    feats = base + strength_feats + lifecycle_oh + cat_flags  # 8+10+8+5 = 31? Hmm need 36
    # Pad with js_resilience, js_failure, js_leadership, years_exp, defect_rate, productivity
    extra = [
        req.js_resilience / 100.0,
        req.js_failure_score / 100.0,
        req.js_leadership_score / 10.0,
        min(req.productivity_cycles / 8.0, 1.0),
        min(req.defect_fix_hours / 100.0, 1.0),
    ]
    feats = feats + extra  # 8+10+8+5+5 = 36

    return torch.tensor([feats], dtype=torch.float32)  # (1, 36)


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "models_loaded": list(_models.keys()),
        "metrics": _metrics,
    }


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    if not _models:
        raise HTTPException(status_code=503, detail="No models loaded")

    result: dict = {}

    # ── 1. ResilienceMLP ──────────────────────────────────────────────────────
    resilience_index = req.js_resilience  # fallback
    if "resilience" in _models:
        try:
            model = _models["resilience"]
            feats = _build_resilience_features(req)
            with torch.no_grad():
                raw = model(feats).item()
            # Output is unbounded scalar → sigmoid → scale to 0-100
            resilience_index = round(float(torch.sigmoid(torch.tensor(raw)).item()) * 100, 1)
        except Exception as e:
            print(f"[resilience] inference error: {e}")

    # ── 2. FailureLSTM ────────────────────────────────────────────────────────
    failure_score = req.js_failure_score  # fallback
    growth_trajectory = "stable"          # fallback
    if "failure" in _models:
        try:
            model = _models["failure"]
            seq = _build_lstm_sequence(req)
            with torch.no_grad():
                f_score_raw, traj_logits = model(seq)
            # failure_score: sigmoid → 0-100
            failure_score = round(float(torch.sigmoid(f_score_raw[0]).item()) * 100, 1)
            traj_idx = int(traj_logits[0].argmax().item())
            growth_trajectory = TRAJECTORY_LABELS[traj_idx]
        except Exception as e:
            print(f"[failure] inference error: {e}")

    # ── 3. RoleMatcher ────────────────────────────────────────────────────────
    top_roles: list[RoleResult] = []
    if "role" in _models:
        try:
            model = _models["role"]
            # Put model in eval for BN (eval mode uses running stats)
            model.eval()
            role_feats = _build_role_features(req, resilience_index, failure_score)
            with torch.no_grad():
                scores = model(role_feats)[0]  # (10,)
                probs = F.softmax(scores, dim=0).tolist()
            ranked = sorted(enumerate(probs), key=lambda x: -x[1])
            top_roles = [
                RoleResult(role=ROLE_NAMES[i], match_score=round(p * 100, 1), rank=rank + 1)
                for rank, (i, p) in enumerate(ranked[:3])
            ]
        except Exception as e:
            print(f"[role] inference error: {e}")

    return AnalyzeResponse(
        resilience_index=resilience_index,
        failure_score=failure_score,
        growth_trajectory=growth_trajectory,
        top_roles=top_roles,
        model_versions={
            "resilience_mlp": str(_metrics.get("resilience_mlp", {}).get("epochs", "?")),
            "failure_lstm": str(_metrics.get("failure_lstm", {}).get("epochs", "?")),
            "role_matcher": str(_metrics.get("role_matcher", {}).get("epochs", "?")),
        },
    )
