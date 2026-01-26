import subprocess
import tempfile


def extract_audio_from_video(video_path: str) -> str:
    """
    Extracts audio from a video file using FFmpeg.
    Uses a temporary WAV file instead of creating directories.
    Returns: path to the temporary WAV file.
    """

    # Create a temporary WAV file
    temp_audio = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    audio_path = temp_audio.name
    temp_audio.close()  # Close so ffmpeg can write into it

    command = [
        "ffmpeg",
        "-i", video_path,       # input video
        "-vn",                  # no video
        "-acodec", "pcm_s16le", # 16-bit PCM
        "-ar", "16000",         # 16 kHz (recommended for Whisper)
        "-ac", "1",             # mono
        audio_path,
        "-y"                    # overwrite
    ]

    subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    return audio_path
