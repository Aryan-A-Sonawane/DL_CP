"""
FailureLSTM — inferred from failure_lstm.pt.zip checkpoint

Architecture (from weight tensor shapes):
  lstm: Bidirectional LSTM, 2 layers, hidden=64, input=7
    Layer 0: weight_ih [256, 7]  → 4*64=256, input_size=7
    Layer 1: weight_ih [256, 128] → 4*64, input from 2*64=128 (bidirectional)
  shared.0: Linear(128 → 64)
  failure_head.0: Linear(64 → 16), failure_head.2: Linear(16 → 1)   [failure score 0-100]
  trajectory_head.0: Linear(64 → 16), trajectory_head.2: Linear(16 → 3)  [ascending/stable/descending]

Input: sequence of failure events, each encoded as 7 features:
  severity, category_weight, recovery_time_days, outcome_improved,
  outcome_declined, tat_normalized, days_ago_normalized

Output:
  failure_score: float 0–100
  trajectory_logits: [3] → argmax → 0=ascending 1=stable 2=descending
"""

import torch
import torch.nn as nn


TRAJECTORY_LABELS = ["ascending", "stable", "descending"]


class FailureLSTM(nn.Module):
    INPUT_SIZE = 7
    HIDDEN_SIZE = 64
    NUM_LAYERS = 2

    def __init__(self):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=self.INPUT_SIZE,
            hidden_size=self.HIDDEN_SIZE,
            num_layers=self.NUM_LAYERS,
            batch_first=True,
            bidirectional=True,
            dropout=0.3,
        )
        # After bidirectional LSTM: hidden = 2 * 64 = 128
        self.shared = nn.Sequential(
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
        )
        self.failure_head = nn.Sequential(
            nn.Linear(64, 16),
            nn.ReLU(),
            nn.Linear(16, 1),
        )
        self.trajectory_head = nn.Sequential(
            nn.Linear(64, 16),
            nn.ReLU(),
            nn.Linear(16, 3),
        )

    def forward(self, x: torch.Tensor, lengths: torch.Tensor | None = None):
        """
        x: (batch, seq_len, input_size)
        Returns failure_score (batch,) and trajectory_logits (batch, 3)
        """
        out, _ = self.lstm(x)  # (batch, seq_len, 2*hidden)
        # Mean-pool over sequence
        if lengths is not None:
            mask = torch.arange(out.size(1), device=out.device).unsqueeze(0) < lengths.unsqueeze(1)
            pooled = (out * mask.unsqueeze(-1)).sum(1) / lengths.float().unsqueeze(-1)
        else:
            pooled = out.mean(1)
        shared = self.shared(pooled)
        failure_score = self.failure_head(shared).squeeze(-1)
        trajectory_logits = self.trajectory_head(shared)
        return failure_score, trajectory_logits
