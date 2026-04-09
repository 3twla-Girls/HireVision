from fastapi import APIRouter, UploadFile, File, HTTPException
from bson import ObjectId
from Server.config.database import db
from Server.controllers.personality_controller import (
    predict_personality_controller,
    generate_overall_report
)

personalityRouter = APIRouter(
    prefix="/api/v1/personality",
    tags=["api_v1", "personality"],
)

# ----------- SAVE RAW SCORES ------------
@personalityRouter.post("/predict/{session_id}")
async def predict_personality(session_id: str, file: UploadFile = File(...)):
    result = await predict_personality_controller(file)

    # PUSH to list
    db.interview_sessions.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$push": {
                "personality.traits_list": result["traits"]
            },
            "$set": {
                "personality.status": "collecting"
            }
        }
    )

    return result
# ----------- GENERATE FINAL REPORT ------------
@personalityRouter.post("/process/{session_id}")
async def process_personality(session_id: str):
    # No await here
    session = db.interview_sessions.find_one({"_id": ObjectId(session_id)})

    if not session:
        raise HTTPException(404, "Session not found")

    traits_list = session.get("personality", {}).get("traits_list", [])

    if not traits_list:
        raise HTTPException(400, "No personality data")

    report = generate_overall_report(traits_list)

    # No await here
    db.interview_sessions.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$set": {
                "personality.status": "completed",
                "personality.overall": report
            }
        }
    )

    return {
        "status": "completed",
        "report": report
    }