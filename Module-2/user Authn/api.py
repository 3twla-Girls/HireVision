"""
api.py – FastAPI proctoring service

Endpoints:
  POST   /api/v1/proctoring/session/start   – Start a new interview session (resets state)
  POST   /api/v1/proctoring/session/frame   – Receive a frame from the frontend
  GET    /api/v1/proctoring/session/report  – Get the full incident report for the session
  DELETE /api/v1/proctoring/session/end     – End session and return final report

Frame handling logic:
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
import logging
import uuid
import threading
from datetime import datetime
from typing import Optional

import cv2
import numpy as np
from fastapi import FastAPI, APIRouter, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from fastapi import status

# ── Import algorithm unchanged ───────────────────────────────
from backend import save_reference_embedding, verify_faces, detect_face
from config import REFERENCE_IMAGE_COUNT, EMBEDDING_PATH

import os

# ─────────────────────────────────────────────────────────────
# LOGGER
# ─────────────────────────────────────────────────────────────

logger = logging.getLogger("uvicorn.error")


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
# ROUTER INITIALIZATION
# ─────────────────────────────────────────────────────────────

proctoring_router = APIRouter(
    prefix="/api/v1/proctoring",
    tags=["api_v1", "proctoring"],
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
        "ref_frames_collected": 0,
        "frame_index"         : 0,
        "incidents"           : [],
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
        raise ValueError("Cannot decode image.")
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
    session_id            : str
    frame_index           : int
    phase                 : str

    ref_frames_collected  : int
    ref_frames_required   : int

    alert                 : Optional[bool]  = None
    alert_type            : Optional[str]   = None
    alert_message         : Optional[str]   = None
    verified              : Optional[bool]  = None
    distance              : Optional[float] = None
    face_count            : Optional[int]   = None

    diff_miss_count       : int
    gone_miss_count       : int
    multi_miss_count      : int


class ReportResponse(BaseModel):
    session_id            : str
    started_at            : str
    ended_at              : str
    total_frames          : int
    ref_frames_collected  : int
    diff_miss_count       : int
    gone_miss_count       : int
    multi_miss_count      : int
    incidents             : list


# ─────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────

# ── START SESSION ─────────────────────────────────────────────

"""@proctoring_router.post("/session/start")
async def start_session(request: Request):
     
    try:
        with _lock:
            if os.path.exists(EMBEDDING_PATH):
                os.remove(EMBEDDING_PATH)

            _reset_session()

            return JSONResponse(
                status_code=status.HTTP_201_CREATED,
                content={
                    "session_id"          : _session["id"],
                    "started_at"          : _session["started_at"],
                    "phase"               : _session["phase"],
                    "ref_frames_required" : REFERENCE_IMAGE_COUNT,
                    "message"             : "Session started. Send the first frame.",
                }
            )
    except Exception as e:
        logger.error(f"Error starting proctoring session: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": str(e)}
        )"""


# ── RECEIVE FRAME ─────────────────────────────────────────────

@proctoring_router.post("/session/frame")
async def receive_frame(request: Request, image: UploadFile = File(...)):
    """
    Receive one frame from the frontend.

    Phase 1 – reference (first REFERENCE_IMAGE_COUNT valid face frames):
        Saves the frame as a reference embedding if a face is detected.
        Returns phase="reference" with ref_frames_collected counter.
        Frontend should keep sending frames until ref_frames_collected == ref_frames_required.

    Phase 2 – monitoring (all subsequent frames):
        Runs the verification algorithm.
        Returns alert=True/False and alert details.
        All incidents are accumulated for the final report.
    """
    try:
        with _lock:
            frame = _decode_image(image)
            idx   = _session["frame_index"]
            _session["frame_index"] += 1

            # ── PHASE 1: collect reference embeddings ─────────────────────
            if _session["phase"] == "reference":

                if detect_face(frame):
                    save_reference_embedding(frame)
                    _session["ref_frames_collected"] += 1

                    if _session["ref_frames_collected"] >= REFERENCE_IMAGE_COUNT:
                        _session["phase"] = "monitoring"

                response = FrameResponse(
                    session_id            = _session["id"],
                    frame_index           = idx,
                    phase                 = _session["phase"],
                    ref_frames_collected  = _session["ref_frames_collected"],
                    ref_frames_required   = REFERENCE_IMAGE_COUNT,
                    diff_miss_count       = _session["diff_miss_count"],
                    gone_miss_count       = _session["gone_miss_count"],
                    multi_miss_count      = _session["multi_miss_count"],
                )
                return JSONResponse(
                    status_code=status.HTTP_200_OK,
                    content=jsonable_encoder(response)
                )

            # ── PHASE 2: verify ───────────────────────────────────────────
            result     = verify_faces(frame)
            alert      = False
            alert_type = None
            alert_msg  = None

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

            response = FrameResponse(
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
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content=jsonable_encoder(response)
            )

    except Exception as e:
        logger.error(f"Error processing frame: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": str(e)}
        )


# ── GET REPORT ────────────────────────────────────────────────

@proctoring_router.get("/session/report")
async def get_report(request: Request):
    """Return the accumulated incident report for the current session."""
    try:
        with _lock:
            response = ReportResponse(
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
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content=jsonable_encoder(response)
            )
    except Exception as e:
        logger.error(f"Error retrieving session report: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": str(e)}
        )


# ── END SESSION ───────────────────────────────────────────────

@proctoring_router.delete("/session/end")
async def end_session(request: Request):
    """
    End the session and return the final report.
    Equivalent to GET /session/report but signals the interview is over.
    """
    try:
        with _lock:
            response = ReportResponse(
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
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content=jsonable_encoder(response)
            )
    except Exception as e:
        logger.error(f"Error ending session: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": str(e)}
        )


# ─────────────────────────────────────────────────────────────
# REGISTER ROUTER
# ─────────────────────────────────────────────────────────────

app.include_router(proctoring_router)
