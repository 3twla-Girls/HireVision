from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
from Server.config.database import db

router = APIRouter(
    prefix="/api/v1/cheating",
    tags=["api_v1", "cheating"],
)

# ===============================
# MODEL
# ===============================
class CheatingEvent(BaseModel):
    session_id: str
    event_type: str
    timestamp: datetime


# ===============================
# SUPPORTED EVENTS
# ===============================
ALLOWED_EVENTS = [
    "TAB_SWITCH",
    "WINDOW_BLUR",
    "WINDOW_FOCUS",
    "EXIT_FULLSCREEN",
    "COPY_ATTEMPT",
    "PASTE_ATTEMPT",
    "SHORTCUT_BLOCKED"
]


# ===============================
# LOG EVENT + UPDATE COUNTS
# ===============================
@router.post("/log")
async def log_cheating_event(event: CheatingEvent):

    if event.event_type not in ALLOWED_EVENTS:
        raise HTTPException(status_code=400, detail="Invalid event type")

    session = db.interview_sessions.find_one(
        {"_id": ObjectId(event.session_id)}
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # ===============================
    # INIT STRUCTURE IF NOT EXISTS
    # ===============================
    if "tab_proctoring" not in session:
        db.interview_sessions.update_one(
            {"_id": ObjectId(event.session_id)},
            {
                "$set": {
                    "tab_proctoring": {
                        "counts": {e: 0 for e in ALLOWED_EVENTS},
                        "events": []
                    }
                }
            }
        )

    # ===============================
    # UPDATE COUNT + PUSH EVENT
    # ===============================
    db.interview_sessions.update_one(
        {"_id": ObjectId(event.session_id)},
        {
            "$inc": {
                f"tab_proctoring.counts.{event.event_type}": 1
            },
            "$push": {
                "tab_proctoring.events": {
                    "type": event.event_type,
                    "timestamp": event.timestamp
                }
            },
            "$set": {
                "updated_at": datetime.utcnow()
            }
        }
    )

    return {
        "message": "Event logged successfully",
        "event_type": event.event_type
    }