"""
backend.py – face detection (Haar Cascade) + embedding (CLIP) logic

Algorithm:
  1. Detect faces using OpenCV Haar Cascade
  2. Crop the largest detected face
  3. Compute embedding via CLIP vision encoder (openai/clip-vit-base-patch32)
  4. Compare against saved reference embedding using cosine distance
  5. Returns face_count so ui.py can alert when multiple people are present
"""

import os
import cv2
import numpy as np
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPVisionModel

from config import (
    EMBEDDING_PATH,
    HAAR_CASCADE_PATH,
    COSINE_THRESHOLD,
    REFERENCE_IMAGE_COUNT,
)

os.makedirs(os.path.dirname(EMBEDDING_PATH), exist_ok=True)

# ── Load Haar Cascade once at import time ────────────────────
_haar = cv2.CascadeClassifier(HAAR_CASCADE_PATH)
if _haar.empty():
    raise RuntimeError(
        f"Could not load Haar Cascade from: {HAAR_CASCADE_PATH}\n"
        "Make sure opencv-python is installed correctly."
    )

# ── Load CLIP vision model once at import time ───────────────
print("Loading embedding model (first run downloads ~350 MB)...")
_model_name = "openai/clip-vit-base-patch32"
_processor  = CLIPProcessor.from_pretrained(_model_name)
_model      = CLIPVisionModel.from_pretrained(_model_name)
_model.eval()
print("Model ready.")


# ─────────────────────────────────────────────────────────────
# INTERNAL HELPERS
# ─────────────────────────────────────────────────────────────

def _detect_faces_raw(bgr_frame):
    """
    Runs Haar Cascade on a BGR numpy frame.
    Returns a list of (x, y, w, h) tuples — one per detected face.
    """
    gray  = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2GRAY)
    faces = _haar.detectMultiScale(
        gray,
        scaleFactor  = 1.05,
        minNeighbors = 5,
        minSize      = (80, 80),
    )
    return [] if len(faces) == 0 else list(faces)


def _crop_largest_face(bgr_frame, faces):
    """Returns a PIL RGB Image of the largest detected face crop."""
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    crop_bgr   = bgr_frame[y: y + h, x: x + w]
    crop_rgb   = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2RGB)
    return Image.fromarray(crop_rgb)


def _get_embedding(pil_image):
    """
    Returns a normalised 1-D embedding vector using CLIP vision encoder.
    """
    inputs = _processor(images=pil_image, return_tensors="pt")
    with torch.no_grad():
        outputs = _model(**inputs)
    emb  = outputs.pooler_output[0].numpy()
    norm = np.linalg.norm(emb)
    return None if norm < 1e-6 else emb / norm


def _cosine_distance(a, b):
    """Euclidean distance between two unit vectors."""
    return float(np.linalg.norm(a - b))


# ─────────────────────────────────────────────────────────────
# PUBLIC API
# ─────────────────────────────────────────────────────────────

def detect_face(bgr_frame):
    """Returns True if exactly one face is detected (used at reference capture)."""
    return len(_detect_faces_raw(bgr_frame)) == 1


def save_reference_embedding(bgr_frame):
    """
    Detect the face in bgr_frame, compute its embedding, and save it to disk.
    If multiple embeddings exist, it appends the new one and keeps only the latest N.
    Raises ValueError if no face is found.
    """
    faces = _detect_faces_raw(bgr_frame)
    if not faces:
        raise ValueError("No face detected in reference frame.")
    pil_img = _crop_largest_face(bgr_frame, faces)
    new_emb = _get_embedding(pil_img)

    if os.path.exists(EMBEDDING_PATH):
        existing_embeddings = np.load(EMBEDDING_PATH)
        # Ensure existing_embeddings is 2D if it's a single embedding
        if existing_embeddings.ndim == 1:
            existing_embeddings = np.expand_dims(existing_embeddings, axis=0)
        all_embeddings = np.vstack((existing_embeddings, new_emb))
    else:
        all_embeddings = np.expand_dims(new_emb, axis=0)

    # Keep only the latest REFERENCE_IMAGE_COUNT embeddings
    if len(all_embeddings) > REFERENCE_IMAGE_COUNT:
        all_embeddings = all_embeddings[-REFERENCE_IMAGE_COUNT:]

    np.save(EMBEDDING_PATH, all_embeddings)


def load_reference_embedding():
    """
    Returns the averaged reference embedding array, or None if not saved yet.
    If multiple embeddings are saved, it returns their mean.
    """
    if not os.path.exists(EMBEDDING_PATH):
        return None
    
    all_embeddings = np.load(EMBEDDING_PATH)
    
    # If only one embedding is saved, ensure it's treated as a 2D array for consistency
    if all_embeddings.ndim == 1:
        all_embeddings = np.expand_dims(all_embeddings, axis=0)
        
    # Compute the mean of all stored embeddings
    mean_embedding = np.mean(all_embeddings, axis=0)
    
    # Normalize the mean embedding
    norm = np.linalg.norm(mean_embedding)
    return None if norm < 1e-6 else mean_embedding / norm


def verify_faces(bgr_frame):
    """
    Analyses bgr_frame and compares against the saved reference embedding.

    Returns a dict:
        verified    – bool  : True if same person
        distance    – float : embedding distance (lower = more similar)
        threshold   – float : configured threshold
        no_face     – bool  : True if zero faces detected
        multi_face  – bool  : True if more than one face detected
        face_count  – int   : number of faces found in frame
    """
    ref_emb    = load_reference_embedding()
    faces      = _detect_faces_raw(bgr_frame)
    face_count = len(faces)

    result = {
        "verified"  : False,
        "distance"  : 1.0,
        "threshold" : COSINE_THRESHOLD,
        "no_face"   : False,
        "multi_face": False,
        "face_count": face_count,
    }

    # ── No face detected ─────────────────────────────────────
    if face_count == 0:
        result["no_face"] = True
        return result

    # ── Check identity against reference embedding ───────────
    if ref_emb is None:
        return result

    min_distance = 1.0 # Initialize with max possible distance
    is_verified  = False

    for face in faces:
        # Crop each face and get its embedding
        x, y, w, h = face
        crop_bgr   = bgr_frame[y: y + h, x: x + w]
        crop_rgb   = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2RGB)
        pil_img    = Image.fromarray(crop_rgb)
        live_emb   = _get_embedding(pil_img)

        if live_emb is not None:
            distance = _cosine_distance(ref_emb, live_emb)
            min_distance = min(min_distance, distance)

            if distance < COSINE_THRESHOLD:
                is_verified = True
                # If one face is verified, we can consider the person verified
                # but continue to find the minimum distance among all faces for reporting

    result["distance"] = min_distance
    result["verified"] = is_verified

    # ── Multiple faces detected ───────────────────────────────
    if face_count > 1:
        result["multi_face"] = True

    return result
