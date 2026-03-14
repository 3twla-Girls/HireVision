# ============================================================
#  cheating_router.py  — FastAPI router
#
#  Mount in your main FastAPI app:
#    from routers.cheating_router import router as cheating_router
#    app.include_router(cheating_router, prefix="/api")
#
#  ENDPOINT
#  ─────────────────────────────────────────────────────────
#  POST /api/cheating-log
#    Called once at the end of the interview.
#    Saves a structured log file per session and returns it.
#
#  GET  /api/cheating-log/{session_id}
#    Returns the saved log for a session (for HR dashboard).
# ============================================================

import logging
from urllib import request

from Server.models.enums import DataBaseEnum
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json, os
from bson import ObjectId



eyeGazeCheating_router = APIRouter(
    prefix="/api/v1/eye-gaze-cheating",
    tags=["api_v1", "cheating-detection"],
)

LOG_DIR = "logs/cheating"
os.makedirs(LOG_DIR, exist_ok=True)


# ─────────────────────────────────────────────────────────────
#  SCHEMAS
# ─────────────────────────────────────────────────────────────

class CheatingEvent(BaseModel):
    type:           str
    at:             str
    duration:       float
    head_dir:       Optional[str] = None
    gaze_dir:       Optional[str] = None
    warning_number: Optional[int] = None


class CheatingLogPayload(BaseModel):
    session_id:     str
    interview_id:   Optional[str] = None
    total_warnings: int           = 0
    total_duration: float         = 0.0
    events:         List[CheatingEvent] = []


# ─────────────────────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────────────────────

def log_path(session_id: str) -> str:
    safe = "".join(c if c.isalnum() or c in "-_" else "_" for c in session_id)
    return os.path.join(LOG_DIR, f"{safe}.json")


# ─────────────────────────────────────────────────────────────
#  DEBUG — POST /api/cheating-log/debug
#  Call this to see exactly what the frontend is sending.
#  Remove this route once everything is working.
# ─────────────────────────────────────────────────────────────

@eyeGazeCheating_router.post("/cheating-log/debug")
async def debug_cheating_log(request: Request):
    body = await request.json()
    print("[DEBUG] Raw body received:", body)
    return JSONResponse(content={"received": body})


# ─────────────────────────────────────────────────────────────
#  POST /api/cheating-log
# ─────────────────────────────────────────────────────────────
@eyeGazeCheating_router.post("/cheating-log")
async def save_cheating_log(request: Request, payload: CheatingLogPayload):
    current_file_path = log_path(payload.session_id)
    
    record = {
        "session_id":     payload.session_id,
        "interview_id":   payload.interview_id,
        "submitted_at":   datetime.utcnow().isoformat() + "Z",
        "total_warnings": payload.total_warnings,
        "total_duration": round(payload.total_duration, 1),
        "events": [
            {
                "type":     e.type,
                "at":       e.at,
                "duration": round(e.duration, 1),
                "head_dir": e.head_dir,
                "gaze_dir": e.gaze_dir,
                **({"warning_number": e.warning_number} if e.warning_number is not None else {}),
            }
            for e in payload.events
        ],
    }

    with open(current_file_path, "w") as f:
        json.dump(record, f, indent=2)

    print(f"[cheating] {payload.session_id} | {payload.total_warnings} warnings")

    try:
        db = request.app.db_client[DataBaseEnum.COLLECTION_INTERVIEW_SESSIONS_NAME.value]
        
        await db.update_one(
            {"_id": ObjectId(payload.session_id)},
            {
                "$set": {
                    "final_summary.integrity.eye_gaze": {
                        "total_warnings": payload.total_warnings,
                        "total_duration": round(payload.total_duration, 1),
                        "status": "Passed" if payload.total_warnings < 3 else "High Alerts",
                        "log_file_path": current_file_path
                    }
                }
            }
        )
        print(f"✅ DB Updated for session: {payload.session_id}")
    except Exception as e:
        print(f"❌ DB Update failed: {str(e)}")

    return {"ok": True, "session_id": payload.session_id, "summary": record}


# ─────────────────────────────────────────────────────────────
#  GET /api/cheating-log/{session_id}
# ─────────────────────────────────────────────────────────────

@eyeGazeCheating_router.get("/cheating-log/{session_id}")
async def get_cheating_log(session_id: str):
    path = log_path(session_id)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Log not found for this session")
    with open(path) as f:
        return json.load(f)