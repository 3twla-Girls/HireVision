from fastapi import APIRouter, UploadFile, File
from services.audio_service import full_transcription_pipeline
import shutil
import os

router = APIRouter()

@router.post("/transcribe-video")
async def transcribe_video(file: UploadFile = File(...)):

    # Save uploaded file temporarily
    temp_path = f"temp_video/{file.filename}"
    os.makedirs("temp_video", exist_ok=True)

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Run full pipeline
    transcription = full_transcription_pipeline(temp_path)

    return {
        "status": "success",
        "transcription": transcription
    }
