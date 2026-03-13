import os
import cv2
import numpy as np
import logging
import threading
from datetime import datetime
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPVisionModel
from fastapi import UploadFile

from Module2.userAuthn.config import (
    HAAR_CASCADE_PATH,
    COSINE_THRESHOLD,
    REFERENCE_IMAGE_COUNT,
    SCRIPT_DIR
)

logger = logging.getLogger("uvicorn.error")

class ProctoringController:
    _model_name = "openai/clip-vit-base-patch32"
    _processor = CLIPProcessor.from_pretrained(_model_name)
    # _model = CLIPVisionModel.from_pretrained(_model_name)
    _model = CLIPVisionModel.from_pretrained(_model_name, use_safetensors=True)
    _model.eval()
    _haar = cv2.CascadeClassifier(HAAR_CASCADE_PATH)
    
    active_sessions = {}
    _lock = threading.Lock()

    def __init__(self):
        self.embeddings_dir = os.path.join(SCRIPT_DIR, "embeddings")
        os.makedirs(self.embeddings_dir, exist_ok=True)

    @classmethod
    async def create_instance(cls):
        return cls()

    def _get_session_path(self, session_id: str):
        return os.path.join(self.embeddings_dir, f"ref_{session_id}.npy")

    @classmethod
    def _get_or_init_session(self, session_id: str):
        if session_id not in self.active_sessions:
            self.active_sessions[session_id] = {
                "id": session_id,
                "phase": "reference",
                "ref_frames_collected": 0,
                "frame_index": 0,
                "incidents": [],
                "diff_miss_count": 0,
                "gone_miss_count": 0,
                "multi_miss_count": 0,
                "started_at": datetime.utcnow().isoformat()
            }
        return self.active_sessions[session_id]

    def _get_embedding(self, pil_image):
        inputs = self._processor(images=pil_image, return_tensors="pt")
        with torch.no_grad():
            outputs = self._model(**inputs)
        emb = outputs.pooler_output[0].numpy()
        norm = np.linalg.norm(emb)
        return None if norm < 1e-6 else emb / norm

    async def process_frame(self, session_id: str, image: UploadFile):
        with self._lock:
            session = self._get_or_init_session(session_id)
            
            # Decode image
            data = await image.read()
            arr = np.frombuffer(data, dtype=np.uint8)
            frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            
            idx = session["frame_index"]
            session["frame_index"] += 1
            
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = self._haar.detectMultiScale(gray, 1.05, 5, minSize=(80, 80))
            face_count = len(faces)

            # --- PHASE 1: REFERENCE ---
            if session["phase"] == "reference":
                if face_count == 1:
                    x, y, w, h = faces[0]
                    crop = Image.fromarray(cv2.cvtColor(frame[y:y+h, x:x+w], cv2.COLOR_BGR2RGB))
                    new_emb = self._get_embedding(crop)
                    
                    path = self._get_session_path(session_id)
                    if os.path.exists(path):
                        existing = np.load(path)
                        all_embs = np.vstack((existing, new_emb)) if existing.ndim > 1 else np.vstack(([existing], [new_emb]))
                    else:
                        all_embs = np.expand_dims(new_emb, axis=0)

                    np.save(path, all_embs)
                    session["ref_frames_collected"] += 1
                    
                    if session["ref_frames_collected"] >= REFERENCE_IMAGE_COUNT:
                        session["phase"] = "monitoring"
                
                return {**session, "face_count": face_count}

            # --- PHASE 2: MONITORING ---
            path = self._get_session_path(session_id)
            if not os.path.exists(path):
                return {"error": "Reference embeddings not found"}
            
            ref_embs = np.load(path)
            mean_ref = np.mean(ref_embs, axis=0)
            mean_ref /= np.linalg.norm(mean_ref)

            alert = False
            alert_type = None
            
            if face_count == 0:
                alert, alert_type = True, "no_face"
                session["gone_miss_count"] += 1
            elif face_count > 1:
                alert, alert_type = True, "multi_face"
                session["multi_miss_count"] += 1
            else:
                x, y, w, h = faces[0]
                crop = Image.fromarray(cv2.cvtColor(frame[y:y+h, x:x+w], cv2.COLOR_BGR2RGB))
                live_emb = self._get_embedding(crop)
                distance = float(np.linalg.norm(mean_ref - live_emb))
                
                if distance > COSINE_THRESHOLD:
                    alert, alert_type = True, "different_person"
                    session["diff_miss_count"] += 1

            if alert:
                session["incidents"].append({
                    "timestamp": datetime.utcnow().isoformat(),
                    "frame_index": idx,
                    "alert_type": alert_type
                })

            return {**session, "alert": alert, "alert_type": alert_type, "face_count": face_count}

    def get_report(self, session_id: str):
        return self.active_sessions.get(session_id, {"error": "Session not found"})

    def end_session(self, session_id: str):
        report = self.active_sessions.pop(session_id, {})
        path = self._get_session_path(session_id)
        if os.path.exists(path):
            os.remove(path)
        return report