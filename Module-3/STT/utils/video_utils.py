import subprocess
import os

def extract_audio_from_video(video_path: str, output_dir="temp_audio"):
    """
    Extract audio from video using FFmpeg.
    Output: WAV 16-bit PCM (best for Whisper)
    """

    os.makedirs(output_dir, exist_ok=True)
    audio_path = os.path.join(output_dir, "extracted_audio.wav")

    command = [
        "ffmpeg",
        "-i", video_path,       # input file
        "-vn",                  # no video
        "-acodec", "pcm_s16le", # Whisper best format
        "-ar", "16000",         # Whisper recommended 16 kHz
        "-ac", "1",             # mono audio
        audio_path,
        "-y"                    # overwrite
    ]

    subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    return audio_path
