import torch
import torch.nn as nn
from torchvision import models
import cv2
import numpy as np
from facenet_pytorch import MTCNN

# 1. Define Architecture
class PersonalityR3D(nn.Module):
    def __init__(self, num_traits=5, dropout=0.5):
        super(PersonalityR3D, self).__init__()
        # 1. Build the feature extractor (Everything except the final FC layer)
        base_model = models.video.r3d_18(weights=None) # We don't need pretrained here, we have yours
        self.feature_extractor = nn.Sequential(
            base_model.stem,
            base_model.layer1,
            base_model.layer2,
            base_model.layer3,
            base_model.layer4,
            nn.AdaptiveAvgPool3d((1, 1, 1)),
            nn.Flatten()
        )
        
        num_features = 512 # R3D-18 features
        
        # 2. Shared layers
        self.shared_head = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(num_features, 256),
            nn.BatchNorm1d(256),
            nn.ReLU()
        )
        
        # 3. Individual heads for each trait
        self.trait_heads = nn.ModuleList([
            nn.Sequential(
                nn.Linear(256, 64),
                nn.ReLU(),
                nn.Dropout(dropout / 2),
                nn.Linear(64, 1),
                nn.Sigmoid()
            ) for _ in range(num_traits)
        ])

    def forward(self, x):
        features = self.feature_extractor(x)
        shared = self.shared_head(features)
        
        # Collect predictions from each head
        outputs = [head(shared) for head in self.trait_heads]
        return torch.cat(outputs, dim=1)
    
# 2. Preprocessing Logic
class PersonalityPredictor:
    def __init__(self, model_path):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.mtcnn = MTCNN(image_size=112, margin=20, device=self.device, post_process=True)
        
        # Load weights
        self.model = PersonalityR3D(num_traits=5)
        checkpoint = torch.load(model_path, map_location=self.device)
        self.model.load_state_dict(checkpoint["model_state"])
        self.model.to(self.device)
        self.model.eval()

        self.traits = ["Openness", "Conscientiousness", "Extraversion", "Agreeableness", "Neuroticism"]
        # Means/Stds from your notebook
        self.mean = torch.tensor([0.43216, 0.394666, 0.37645]).view(3, 1, 1, 1).to(self.device)
        self.std = torch.tensor([0.22803, 0.22145, 0.216989]).view(3, 1, 1, 1).to(self.device)

    def _count_frames(self, video_path):
        # CAP_PROP_FRAME_COUNT is unreliable for streamed WebM produced by the
        # browser's MediaRecorder (it often returns 0 or a bogus value because
        # the container has no duration/frame-count header). Count frames by
        # walking the stream with grab(), which advances without decoding —
        # cheap and memory-safe even for long clips.
        cap = cv2.VideoCapture(video_path)
        count = 0
        while cap.grab():
            count += 1
        cap.release()
        return count

    def process_video(self, video_path):
        v_len = self._count_frames(video_path)
        if v_len == 0:
            raise ValueError(f"No readable frames in video: {video_path}")

        # Select 16 evenly spaced frame indices. When the clip is shorter than
        # 16 frames, indices repeat so we always end up with exactly 16 frames
        # (required for the R3D tensor shape).
        order = np.linspace(0, v_len - 1, 16).astype(int)
        wanted = set(order.tolist())

        # Second pass: decode only the frames we actually need.
        cap = cv2.VideoCapture(video_path)
        faces_by_index = {}
        i = 0
        while True:
            success, frame = cap.read()
            if not success:
                break
            if i in wanted:
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                face = self.mtcnn(frame_rgb)
                if face is None:  # Fallback if no face detected
                    face = torch.zeros((3, 112, 112))
                faces_by_index[i] = face
            i += 1
        cap.release()

        # Build exactly 16 frames following the sampled order (handles repeats).
        zero = torch.zeros((3, 112, 112))
        faces = [faces_by_index.get(int(idx), zero) for idx in order]

        # Stack to (C, T, H, W) -> (3, 16, 112, 112)
        video_tensor = torch.stack(faces).permute(1, 0, 2, 3).to(self.device)
        # Normalize
        video_tensor = (video_tensor - self.mean) / self.std
        return video_tensor.unsqueeze(0) # Add batch dimension

    def predict(self, video_path):
        input_tensor = self.process_video(video_path)
        with torch.no_grad():
            preds = self.model(input_tensor).cpu().numpy()[0]
        return {trait: float(score) for trait, score in zip(self.traits, preds)}