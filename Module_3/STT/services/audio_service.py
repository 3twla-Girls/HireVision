from STT.utils.video_utils import extract_audio_from_video
from STT.services.stt_service import transcribe_audio_groq
import os


def full_transcription_pipeline(video_path: str) -> str:
    """
    Full pipeline:
    1. Extract audio from video (temp WAV file)
    2. Send audio to Groq Whisper for transcription
    3. Delete temp audio file
    4. Return text
    """

    # Step 1: Extract temp audio
    audio_path = extract_audio_from_video(video_path)

    try:
        # Step 2: Transcribe using Groq Whisper
        text = transcribe_audio_groq(audio_path)
    finally:
        # Step 3: Cleanup (delete temp wav file)
        if os.path.exists(audio_path):
            os.remove(audio_path)

    return text
