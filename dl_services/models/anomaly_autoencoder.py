"""
AnomalyAutoencoder — auxiliary model for detecting performance anomalies.
Not trained yet (no checkpoint), but architecture stub provided for future use.

When trained it will detect outlier employees whose performance metrics diverge
significantly from their department baseline.
"""

import torch
import torch.nn as nn


class AnomalyAutoencoder(nn.Module):
    INPUT_DIM = 12  # Same 12 features as ResilienceMLP

    def __init__(self, latent_dim: int = 6):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(12, 32),
            nn.ReLU(),
            nn.Linear(32, latent_dim),
        )
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 12),
        )

    def forward(self, x: torch.Tensor):
        z = self.encoder(x)
        x_hat = self.decoder(z)
        reconstruction_error = ((x - x_hat) ** 2).mean(dim=-1)
        return x_hat, reconstruction_error
