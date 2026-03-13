import torch
from models.r3d_model import PersonalityR3D, TRAITS
from video_preprocess import extract_frames

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

WEIGHTS_PATH = "weights/personality_r3d_best.pth"

model = PersonalityR3D().to(DEVICE)

checkpoint = torch.load(WEIGHTS_PATH, map_location=DEVICE)
model.load_state_dict(checkpoint)

model.eval()


def predict_personality(video_path):

    video_tensor = extract_frames(video_path).to(DEVICE)

    with torch.no_grad():
        preds = model(video_tensor)

    preds = preds.cpu().numpy()[0]

    result = {}

    for trait, value in zip(TRAITS, preds):
        result[trait] = float(value)

    return result