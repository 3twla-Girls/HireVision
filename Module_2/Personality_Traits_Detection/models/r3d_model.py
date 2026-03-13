import torch
import torch.nn as nn
from torchvision.models.video import r3d_18

TRAITS = [
    "extraversion",
    "agreeableness",
    "conscientiousness",
    "neuroticism",
    "openness"
]

class PersonalityR3D(nn.Module):

    def __init__(self):
        super().__init__()

        self.backbone = r3d_18(pretrained=False)

        in_features = self.backbone.fc.in_features
        self.backbone.fc = nn.Identity()

        self.heads = nn.ModuleList([
            nn.Sequential(
                nn.Linear(in_features, 128),
                nn.ReLU(),
                nn.Dropout(0.3),
                nn.Linear(128, 1),
                nn.Sigmoid()
            ) for _ in range(len(TRAITS))
        ])

    def forward(self, x):

        features = self.backbone(x)

        outputs = []
        for head in self.heads:
            outputs.append(head(features))

        return torch.cat(outputs, dim=1)