from fastapi import APIRouter, UploadFile, File
from services.audio_service import full_transcription_pipeline
import shutil
import os

router = APIRouter()

@router.post("/transcribe-video")
async def transcribe_video(file: UploadFile = File(...)):
    """
    Accept MP4 video → save temporarily → extract audio → transcribe → return text.
    """

    # Save video temporarily
    os.makedirs("temp_video", exist_ok=True)
    temp_path = f"temp_video/{file.filename}"

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Run transcription pipeline
    text = full_transcription_pipeline(temp_path)

    # Cleanup video file
    if os.path.exists(temp_path):
        os.remove(temp_path)

    return {
        "status": "success",
        "transcription": text
    }
