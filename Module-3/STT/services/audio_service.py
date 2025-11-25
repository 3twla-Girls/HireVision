from utils.video_utils import extract_audio_from_video
from services.stt_service import transcribe_audio_groq

def full_transcription_pipeline(video_path: str):
    """
    Full pipeline:
    1. Extract audio from video
    2. Send audio to Groq for transcription
    3. Return final text
    """

    audio_path = extract_audio_from_video(video_path)
    text = transcribe_audio_groq(audio_path)
    return text
