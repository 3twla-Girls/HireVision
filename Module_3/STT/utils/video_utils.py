import subprocess
import tempfile

FFMPEG_EXECUTABLE = r"C:\Program Files\ffmpeg-2025-12-07-git-c4d22f2d2c-essentials_build\ffmpeg-2025-12-07-git-c4d22f2d2c-essentials_build\bin\ffmpeg.exe"

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
        FFMPEG_EXECUTABLE,
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
