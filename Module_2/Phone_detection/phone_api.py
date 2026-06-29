# ╔══════════════════════════════════════════════════════════════╗
# ║   HireVision — Phone Usage / Cheating Detection API         ║
# ║   Tracks cheating per question per session                  ║
# ╚══════════════════════════════════════════════════════════════╝

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
import shutil
import os
import cv2
import numpy as np
from ultralytics import YOLO

app = FastAPI(title="HireVision Phone Usage API")

# ── In-memory session store ───────────────────────────────────
session_store: dict = {}


# ══════════════════════════════════════════════════════════════
# Predictor Class
# ══════════════════════════════════════════════════════════════

class PhoneUsagePredictor:
    def __init__(self, model_path: str):
        self.model               = YOLO(model_path)
        self.frame_interval      = 3    # sample one frame every 3 seconds
        self.conf_threshold      = 0.5  # min confidence to count as phone detected
        self.consecutive_thresh  = 2    # consecutive positive frames needed = cheating

    def process_video(self, video_path: str):
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")

        fps        = cap.get(cv2.CAP_PROP_FPS) or 25
        step       = int(fps * self.frame_interval)
        total      = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration_s = total / fps

        frame_results = []
        frame_idx     = 0

        while True:
            success, frame = cap.read()
            if not success:
                break

            if frame_idx % step == 0:
                timestamp_s = frame_idx / fps
                frame_rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

                result      = self.model.predict(frame_rgb, verbose=False)[0]
                pred_class  = result.names[result.probs.top1]
                confidence  = float(result.probs.top1conf)
                detected    = pred_class == "positive" and confidence >= self.conf_threshold

                frame_results.append({
                    "timestamp_sec" : round(timestamp_s, 2),
                    "prediction"    : pred_class,
                    "confidence"    : round(confidence, 4),
                    "phone_detected": detected
                })

            frame_idx += 1

        cap.release()
        return frame_results, duration_s

    def detect_cheating_events(self, frame_results: list) -> list:
        cheating_events = []
        streak_start    = None
        streak_count    = 0

        for i, frame in enumerate(frame_results):
            if frame["phone_detected"]:
                if streak_count == 0:
                    streak_start = frame["timestamp_sec"]
                streak_count += 1
            else:
                if streak_count >= self.consecutive_thresh:
                    prev_frame = frame_results[i - 1]
                    cheating_events.append({
                        "start_time_sec": streak_start,
                        "end_time_sec"  : prev_frame["timestamp_sec"],
                        "duration_sec"  : round(prev_frame["timestamp_sec"] - streak_start + self.frame_interval, 2),
                        "frame_count"   : streak_count,
                    })
                streak_start = None
                streak_count = 0

        # Edge case: streak continues until end of video
        if streak_count >= self.consecutive_thresh:
            last_frame = frame_results[-1]
            cheating_events.append({
                "start_time_sec": streak_start,
                "end_time_sec"  : last_frame["timestamp_sec"],
                "duration_sec"  : round(last_frame["timestamp_sec"] - streak_start + self.frame_interval, 2),
                "frame_count"   : streak_count,
            })

        return cheating_events

    def predict(self, video_path: str) -> dict:
        frame_results, duration_s = self.process_video(video_path)
        cheating_events           = self.detect_cheating_events(frame_results)

        total_frames       = len(frame_results)
        positive_frames    = sum(1 for f in frame_results if f["phone_detected"])
        usage_ratio        = positive_frames / total_frames if total_frames > 0 else 0
        total_cheating_sec = sum(e["duration_sec"] for e in cheating_events)

        if len(cheating_events) == 0:
            severity = "Clean"
        elif len(cheating_events) == 1:
            severity = "Suspicious"
        elif len(cheating_events) <= 3:
            severity = "Likely Cheating"
        else:
            severity = "Confirmed Cheating"

        return {
            "summary": {
                "severity"             : severity,
                "is_cheating"          : len(cheating_events) > 0,
                "cheating_events_count": len(cheating_events),
                "total_cheating_sec"   : round(total_cheating_sec, 2),
                "phone_detected_frames": positive_frames,
                "total_frames_sampled" : total_frames,
                "usage_ratio"          : round(usage_ratio, 4),
                "video_duration_sec"   : round(duration_s, 2),
                "frame_interval_sec"   : self.frame_interval,
                "consecutive_thresh"   : self.consecutive_thresh,
            },
            "cheating_events": cheating_events,
            "per_frame"      : frame_results
        }


# ── Initialize predictor at module level (not inside startup event) ──
# This guarantees it's ready before any request comes in
predictor = PhoneUsagePredictor("Module_2/Phone_detection/weights/yolov8_phone_usage_best.pt")
print("✅ Phone usage model loaded.")


# ══════════════════════════════════════════════════════════════
# API Endpoint
# ══════════════════════════════════════════════════════════════

@app.post("/interview/analyze-phone-usage")
async def analyze_phone_usage(
    file       : UploadFile = File(...),
    session_id : str        = Query(..., description="Interview session ID"),
    question_id: str        = Query(..., description="Question ID being answered"),
):
    if not file.filename.endswith(('.mp4', '.avi', '.mov', '.mkv')):
        raise HTTPException(status_code=400, detail="Invalid video format")

    temp_path = f"uploads/{session_id}_{question_id}_{file.filename}"
    os.makedirs("uploads", exist_ok=True)

    try:
        # 1. Save uploaded video
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 2. Run inference
        results = predictor.predict(temp_path)

        # 3. Save into session store
        if session_id not in session_store:
            session_store[session_id] = {}

        session_store[session_id][question_id] = {
            "question_id"    : question_id,
            "is_cheating"    : results["summary"]["is_cheating"],
            "severity"       : results["summary"]["severity"],
            "cheating_events": results["cheating_events"],
            "summary"        : results["summary"],
            "per_frame"      : results["per_frame"],
        }

        return {
            "status"     : "success",
            "session_id" : session_id,
            "question_id": question_id,
            **results
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


# ══════════════════════════════════════════════════════════════
# GET full session cheating report
# ══════════════════════════════════════════════════════════════

@app.get("/interview/cheating-report")
async def get_cheating_report(session_id: str = Query(...)):
    if session_id not in session_store:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")

    session_data    = session_store[session_id]
    total_questions = len(session_data)
    cheating_qs     = [q for q, v in session_data.items() if v["is_cheating"]]

    return {
        "session_id"              : session_id,
        "overall_cheating"        : len(cheating_qs) > 0,
        "questions_with_cheating" : len(cheating_qs),
        "total_questions_analyzed": total_questions,
        "questions"               : session_data,
    }


# ══════════════════════════════════════════════════════════════
# DELETE session from memory after report is consumed
# ══════════════════════════════════════════════════════════════

@app.delete("/interview/session")
async def clear_session(session_id: str = Query(...)):
    if session_id in session_store:
        del session_store[session_id]
        return {"status": "success", "message": f"Session '{session_id}' cleared."}
    raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")