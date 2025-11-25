from groq import Groq
import json
from dotenv import load_dotenv
import os

load_dotenv()  
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def transcribe_audio_groq(audio_path: str) -> str:
    """
    Takes an audio file path and returns transcription text using Groq Whisper.
    """

    with open(audio_path, "rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            file=audio_file,
            model="whisper-large-v3-turbo",
            response_format="verbose_json",
            temperature=0.0
        )

    # Get transcription text only
    # transcription is a Transcription object, NOT a dict
    return transcription.text
