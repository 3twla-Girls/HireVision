import cv2
import torch
import numpy as np
from facenet_pytorch import MTCNN

NUM_FRAMES = 16
IMG_SIZE = 224

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

mtcnn = MTCNN(
    image_size=IMG_SIZE,
    margin=20,
    keep_all=False,
    device=device
)

def extract_frames(video_path):

    cap = cv2.VideoCapture(video_path)
    frames = []

    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    step = max(total // NUM_FRAMES, 1)

    for i in range(NUM_FRAMES):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i * step)
        ret, frame = cap.read()

        if not ret:
            break

        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        face = mtcnn(frame)

        if face is not None:
            frames.append(face)

    cap.release()

    if len(frames) == 0:
        raise ValueError("No face detected")

    video_tensor = torch.stack(frames)

    # T,C,H,W -> C,T,H,W
    video_tensor = video_tensor.permute(1,0,2,3)

    return video_tensor.unsqueeze(0)