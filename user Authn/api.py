"""
api.py – FastAPI proctoring service

Endpoints:
  POST /session/start          – Start a new interview session (resets state)
  POST /session/frame          – Receive a frame from the frontend
  GET  /session/report         – Get the full incident report for the session
  DELETE /session/end          – End session and return final report

Frame handling logic (mirrors ui.py Phase 1 / Phase 2):
  - The frontend sends one image every 10 seconds.
  - The FIRST 5 images (0–50s) are used as reference captures (Phase 1).
      → Each frame is only saved if a face is detected; otherwise it's skipped
        and the frontend is informed to retry.
      → Once 5 valid reference frames are collected, Phase 2 begins.
  - All subsequent images are verification checks (Phase 2).
      → The algorithm result is returned immediately in the response.
      → All incidents are accumulated and returned at /session/report.

Run:
  uvicorn api:app --reload
"""

import io
import uuid
import time
import threading
from datetime import datetime
from typing import Optional

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Import algorithm unchanged ───────────────────────────────
from backend import save_reference_embedding, verify_faces, detect_face
from config import REFERENCE_IMAGE_COUNT


# ─────────────────────────────────────────────────────────────
# APP
# ─────────────────────────────────────────────────────────────

app = FastAPI(title="Proctoring API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────
# SESSION STATE  (single-session; extend to dict for multi)
# ─────────────────────────────────────────────────────────────

_lock = threading.Lock()

_session: dict = {}


def _reset_session():
    """Initialise / clear session state."""
    global _session
    _session = {
        "id"                  : str(uuid.uuid4()),
        "started_at"          : datetime.utcnow().isoformat(),
        "phase"               : "reference",   # "reference" | "monitoring"
        "ref_frames_collected": 0,             # valid reference frames so far
        "frame_index"         : 0,             # total frames received
        "incidents"           : [],            # list of incident dicts
        "diff_miss_count"     : 0,
        "gone_miss_count"     : 0,
        "multi_miss_count"    : 0,
    }


_reset_session()   # initialise on startup


# ─────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────

def _decode_image(upload: UploadFile) -> np.ndarray:
    """Convert an uploaded image file to a BGR numpy array."""
    data  = upload.file.read()
    arr   = np.frombuffer(data, dtype=np.uint8)
    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if frame is None:
        raise HTTPException(status_code=400, detail="Cannot decode image.")
    return frame


def _add_incident(alert_type: str, detail: str, frame_index: int):
    _session["incidents"].append({
        "timestamp"  : datetime.utcnow().isoformat(),
        "frame_index": frame_index,
        "alert_type" : alert_type,   # "no_face" | "multi_face" | "different_person"
        "detail"     : detail,
    })


# ─────────────────────────────────────────────────────────────
# RESPONSE MODELS
# ─────────────────────────────────────────────────────────────

class FrameResponse(BaseModel):
    session_id         : str
    frame_index        : int
    phase              : str          # "reference" | "monitoring"

    # reference phase
    ref_frames_collected: int
    ref_frames_required : int

    # monitoring phase – None during reference phase
    alert              : Optional[bool]      = None
    alert_type         : Optional[str]       = None   # "no_face" | "multi_face" | "different_person"
    alert_message      : Optional[str]       = None
    verified           : Optional[bool]      = None
    distance           : Optional[float]     = None
    face_count         : Optional[int]       = None

    # running counters (always present)
    diff_miss_count    : int
    gone_miss_count    : int
    multi_miss_count   : int


class ReportResponse(BaseModel):
    session_id         : str
    started_at         : str
    ended_at           : str
    total_frames       : int
    ref_frames_collected: int
    diff_miss_count    : int
    gone_miss_count    : int
    multi_miss_count   : int
    incidents          : list


# ─────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────

@app.post("/session/start")
def start_session():
    """
    Start (or restart) a proctoring session.
    Clears all state and reference embeddings.
    """
    with _lock:
        # Remove old embeddings so a fresh reference is captured
        import os
        from config import EMBEDDING_PATH
        if os.path.exists(EMBEDDING_PATH):
            os.remove(EMBEDDING_PATH)

        _reset_session()
        return {
            "session_id"          : _session["id"],
            "started_at"          : _session["started_at"],
            "phase"               : _session["phase"],
            "ref_frames_required" : REFERENCE_IMAGE_COUNT,
            "message"             : "Session started. Send the first frame.",
        }


@app.post("/session/frame", response_model=FrameResponse)
def receive_frame(image: UploadFile = File(...)):
    """
    Receive one frame from the frontend.

    Phase 1 – reference  (first REFERENCE_IMAGE_COUNT valid face frames):
        Saves the frame as a reference embedding if a face is detected.
        Returns phase="reference" with ref_frames_collected counter.
        Frontend should keep sending frames until ref_frames_collected == ref_frames_required.

    Phase 2 – monitoring (all subsequent frames):
        Runs the verification algorithm unchanged.
        Returns alert=True/False and alert details.
        All incidents are accumulated for the final report.
    """
    with _lock:
        frame       = _decode_image(image)
        idx         = _session["frame_index"]
        _session["frame_index"] += 1

        # ── PHASE 1: collect reference embeddings ─────────────────────────────
        if _session["phase"] == "reference":

            if detect_face(frame):
                save_reference_embedding(frame)   # appends & keeps latest N
                _session["ref_frames_collected"] += 1

                if _session["ref_frames_collected"] >= REFERENCE_IMAGE_COUNT:
                    _session["phase"] = "monitoring"

            return FrameResponse(
                session_id            = _session["id"],
                frame_index           = idx,
                phase                 = _session["phase"],
                ref_frames_collected  = _session["ref_frames_collected"],
                ref_frames_required   = REFERENCE_IMAGE_COUNT,
                diff_miss_count       = _session["diff_miss_count"],
                gone_miss_count       = _session["gone_miss_count"],
                multi_miss_count      = _session["multi_miss_count"],
            )

        # ── PHASE 2: verify ────────────────────────────────────────────────────
        result = verify_faces(frame)   # unchanged algorithm call

        alert       = False
        alert_type  = None
        alert_msg   = None

        if result.get("no_face"):
            alert      = True
            alert_type = "no_face"
            alert_msg  = "Candidate left the interview — no face detected."
            _session["gone_miss_count"] += 1
            _add_incident("no_face", alert_msg, idx)

        elif result.get("multi_face"):
            alert      = True
            alert_type = "multi_face"
            alert_msg  = (
                f"Multiple people detected — {result['face_count']} faces in frame."
            )
            _session["multi_miss_count"] += 1
            _add_incident("multi_face", alert_msg, idx)

        elif not result["verified"]:
            alert      = True
            alert_type = "different_person"
            alert_msg  = (
                f"Different candidate detected — "
                f"distance={result['distance']:.3f}, "
                f"threshold={result['threshold']:.3f}."
            )
            _session["diff_miss_count"] += 1
            _add_incident("different_person", alert_msg, idx)

        return FrameResponse(
            session_id            = _session["id"],
            frame_index           = idx,
            phase                 = _session["phase"],
            ref_frames_collected  = _session["ref_frames_collected"],
            ref_frames_required   = REFERENCE_IMAGE_COUNT,
            alert                 = alert,
            alert_type            = alert_type,
            alert_message         = alert_msg,
            verified              = result.get("verified"),
            distance              = result.get("distance"),
            face_count            = result.get("face_count"),
            diff_miss_count       = _session["diff_miss_count"],
            gone_miss_count       = _session["gone_miss_count"],
            multi_miss_count      = _session["multi_miss_count"],
        )


@app.get("/session/report", response_model=ReportResponse)
def get_report():
    """Return the accumulated incident report for the current session."""
    with _lock:
        return ReportResponse(
            session_id            = _session["id"],
            started_at            = _session["started_at"],
            ended_at              = datetime.utcnow().isoformat(),
            total_frames          = _session["frame_index"],
            ref_frames_collected  = _session["ref_frames_collected"],
            diff_miss_count       = _session["diff_miss_count"],
            gone_miss_count       = _session["gone_miss_count"],
            multi_miss_count      = _session["multi_miss_count"],
            incidents             = _session["incidents"],
        )


@app.delete("/session/end", response_model=ReportResponse)
def end_session():
    """
    End the session and return the final report.
    Equivalent to GET /session/report but signals the interview is over.
    """
    return get_report()
