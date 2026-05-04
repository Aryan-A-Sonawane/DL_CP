"""
ResilienceMLP — inferred from resilience_mlp.pt.zip checkpoint

Architecture (from weight tensor shapes):
  net.0  Linear(12 → 64)
  net.1  BatchNorm1d(64)
  net.2  ReLU  [index 2]
  net.3  Dropout(0.3)  [index 3]
  net.4  Linear(64 → 32)
  net.5  BatchNorm1d(32)
  net.6  ReLU  [index 6]
  net.7  Dropout(0.3)  [index 7]
  net.8  Linear(32 → 1)

Input (12 features):
  hours_worked, hours_per_cycle, defects, defect_fix_hours, avg_tat,
  on_time (0/1), soft_skill_score, num_failures, improvement_rate,
  recovery_speed, productivity_cycles, lifecycle_scrum (hot-encoded)

Output: scalar resilience index 0–100
"""

import torch
import torch.nn as nn


class ResilienceMLP(nn.Module):
    INPUT_DIM = 12

    def __init__(self):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(12, 64),           # net.0
            nn.BatchNorm1d(64),          # net.1
            nn.ReLU(),                   # net.2
            nn.Dropout(0.3),             # net.3
            nn.Linear(64, 32),           # net.4
            nn.BatchNorm1d(32),          # net.5
            nn.ReLU(),                   # net.6
            nn.Dropout(0.3),             # net.7
            nn.Linear(32, 1),            # net.8
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x).squeeze(-1)
