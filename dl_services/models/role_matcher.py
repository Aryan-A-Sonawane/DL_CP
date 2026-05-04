"""
RoleMatcher — inferred from role_matcher.pt.zip checkpoint

Architecture: Two-tower contrastive model (employee tower + role embeddings)
  temperature: scalar (learnable, Shape [])
  employee_tower:
    0: Linear(36 → 128)
    1: BatchNorm1d(128)
    2: ReLU
    3: Dropout
    4: Linear(128 → 64)
    5: BatchNorm1d(64)
    6: ReLU
    7: Dropout
    8: Linear(64 → 32)   ← employee embedding space
  role_embedding:
    Embedding(10, 32)     ← 10 roles, 32-dim embeddings

Input (36 features for employee tower):
  resilience_index_norm, failure_score_norm, leadership_score_norm,
  soft_skill_score_norm, years_experience_norm,
  hours_efficiency_norm, defect_rate_norm, tat_norm,
  + 10 strength scores (problem_solving, communication, leadership, empathy,
    system_thinking, creativity, analytical_thinking, crisis_management,
    adaptability, attention_to_detail)
  + 8 lifecycle one-hot (Waterfall, Scrum, Kanban, SAFe, XP, DSDM, Crystal, Spiral)
  + 5 failure category flags (quality_issue, deadline_miss, process_failure,
    team_conflict, system_outage)

Role indices match ROLE_NAMES list (same order as role_embedding rows):
  0: Technical Architect
  1: Engineering Manager
  2: Data Engineering Lead
  3: Product Strategist
  4: UX Research Lead
  5: Customer Success Manager
  6: DevOps Architect
  7: Technical Program Manager
  8: Growth Marketing Strategist
  9: Site Reliability Engineer

Output: cosine similarity scores for all 10 roles
"""

import torch
import torch.nn as nn
import torch.nn.functional as F

ROLE_NAMES = [
    "Technical Architect",
    "Engineering Manager",
    "Data Engineering Lead",
    "Product Strategist",
    "UX Research Lead",
    "Customer Success Manager",
    "DevOps Architect",
    "Technical Program Manager",
    "Growth Marketing Strategist",
    "Site Reliability Engineer",
]


class RoleMatcher(nn.Module):
    EMP_INPUT_DIM = 36
    EMB_DIM = 32
    NUM_ROLES = 10

    def __init__(self):
        super().__init__()
        self.temperature = nn.Parameter(torch.ones([]))
        self.employee_tower = nn.Sequential(
            nn.Linear(36, 128),          # 0
            nn.BatchNorm1d(128),         # 1
            nn.ReLU(),                   # 2
            nn.Dropout(0.3),             # 3
            nn.Linear(128, 64),          # 4
            nn.BatchNorm1d(64),          # 5
            nn.ReLU(),                   # 6
            nn.Dropout(0.3),             # 7
            nn.Linear(64, 32),           # 8
        )
        self.role_embedding = nn.Embedding(10, 32)

    def forward(self, emp_features: torch.Tensor) -> torch.Tensor:
        """
        emp_features: (batch, 36)
        Returns cosine similarity scores (batch, 10) scaled by temperature
        """
        emp_emb = self.employee_tower(emp_features)           # (batch, 32)
        emp_emb = F.normalize(emp_emb, dim=-1)

        role_ids = torch.arange(self.NUM_ROLES, device=emp_features.device)
        role_emb = self.role_embedding(role_ids)              # (10, 32)
        role_emb = F.normalize(role_emb, dim=-1)

        # Cosine similarity: (batch, 10)
        scores = (emp_emb @ role_emb.T) / self.temperature.abs().clamp(min=1e-4)
        return scores
