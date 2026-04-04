# phone_usage_router.py
from fastapi import APIRouter, UploadFile, File, Query
from Server.controllers.phoneDetectionController import(
    analyze_phone_usage,get_cheating_report)
    


PhoneRouter = APIRouter(
    prefix="/api/v1/interview",
    tags=["Phone Usage Detection"]
)

# Make sure to await the controller functions
@PhoneRouter.post("/analyze-phone-usage")
async def analyze_phone_usage_router(
    file       : UploadFile = File(...),
    session_id : str        = Query(...),
    question_id: str        = Query(...)
):
    return await analyze_phone_usage(file, session_id, question_id)


@PhoneRouter.get("/cheating-report")
async def get_cheating_report_router(session_id: str = Query(...)):
    return await get_cheating_report(session_id)