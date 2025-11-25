# Speech-to-Text (STT) Module

A lightweight, production-ready Speech-to-Text pipeline using **FastAPI**, **Groq Whisper**, and **FFmpeg** for audio extraction.
This module converts **video files → audio → text transcription**, and exposes a clean API endpoint.

---

## **Folder Structure**

```
SpeechToText/
│
├── controllers/
│   └── stt_controller.py     # FastAPI route — Accepts video file, returns transcription
│
├── services/
│   ├── audio_service.py      # Full pipeline (video → audio → transcription)
│   └── stt_service.py        # Transcribes audio using Groq Whisper API
│
├── utils/
│   └── video_utils.py        # Extracts audio from video (mp4 → wav)
│
└── main.py                   # FastAPI app entry point
```

---

## 🚀 Features

* Accepts **video uploads** via FastAPI
* Extracts audio using **FFmpeg**
* Sends audio to **Groq Whisper** for transcription
* Returns **clean, formatted text**
* Modular design → easy to extend or integrate into larger systems
* Suitable for **technical interviews**, **AI Q&A systems**, and **automated evaluation platforms**

---

## ⚙️ How It Works (Pipeline)

1. **Client uploads video (.mp4/.mkv/.mov)**
2. `video_utils.py` converts video → `.wav` audio file
3. `stt_service.py` sends audio to **Groq Whisper-Large-V3**
4. API returns transcription as JSON

---

## ▶️ Running the Service

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

Open the interactive docs:

```
http://localhost:8000/docs
```

---

## API Endpoint

### **POST /stt/transcribe-video**

Upload a video file:

**Request (multipart/form-data)**
`file: video.mp4`

**Response:**

```json
{
  "transcription": "This is the text extracted from the uploaded video."
}
```

---

## **Module Responsibilities**

### **controllers/stt_controller.py**

* Exposes the upload endpoint
* Calls audio + STT pipeline
* Returns transcription response

### **services/audio_service.py**

* Handles full conversion process
* Temporary file handling
* Error management

### **services/stt_service.py**

* Communicates with Groq Whisper API
* Sends audio and retrieves text

### **utils/video_utils.py**

* Uses FFmpeg to extract audio
* Ensures consistent WAV formatting

### **main.py**

* FastAPI app instance
* Route registration

---

