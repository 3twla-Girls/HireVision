from bson import ObjectId
from fastapi import HTTPException,APIRouter
from fastapi.responses import StreamingResponse
import io
from Server.controllers.report_generator_Controller import generate_candidate_report, generate_recruiter_report
from Server.config.database import db
router = APIRouter(
    prefix="/evaluation",
    tags=["Phone Usage Detection"]
)

@router.get("{session_id}/report/candidate")
async def candidate_report(session_id: str):
    session_doc = await db.sessions.find_one({"_id": ObjectId(session_id)})
    if not session_doc:
        raise HTTPException(status_code=404, detail="Session not found")
    return StreamingResponse(
        io.BytesIO(generate_candidate_report(session_doc)),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename=candidate_report_{session_id}.docx"},
    )

@router.get("/sessions/{session_id}/report/recruiter")
async def recruiter_report(session_id: str):
    session_doc = await db.sessions.find_one({"_id": ObjectId(session_id)})
    if not session_doc:
        raise HTTPException(status_code=404, detail="Session not found")
    return StreamingResponse(
        io.BytesIO(generate_recruiter_report(session_doc)),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename=recruiter_report_{session_id}.docx"},
    )