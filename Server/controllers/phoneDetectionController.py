from datetime import datetime
from fastapi import UploadFile, File, HTTPException , Query
import shutil, os
from Server.config.database import db
from Module_2.Phone_detection.phone_api import PhoneUsagePredictor
from bson import ObjectId
# Mongo collection
interview_sessions = db.get_collection("interview_sessions")

# Predictor
predictor = PhoneUsagePredictor("Module_2/Phone_detection/weights/yolov8_phone_usage_best.pt")
print("Phone usage model loaded.")


# async def analyze_phone_usage(file: UploadFile, session_id: str, question_id: str):
#     await file.seek(0)
#     if not file.filename.endswith(('.mp4', '.avi', '.mov', '.mkv', '.webm')):
#         raise HTTPException(status_code=400, detail="Invalid video format")

#     temp_path = f"uploads/{session_id}_{question_id}_{file.filename}"
#     os.makedirs("uploads", exist_ok=True)

#     try:
#         # Save uploaded video
#         with open(temp_path, "wb") as buffer:
#             shutil.copyfileobj(file.file, buffer)

#         # Run predictor
#         results = predictor.predict(temp_path)

#         # Object to store under phone_detection
#         phone_obj = {
#             "is_cheating"    : results["summary"]["is_cheating"],
#             "severity"       : results["summary"]["severity"],
#             "cheating_events": results["cheating_events"],
#             "summary"        : results["summary"],
#             "per_frame"      : results["per_frame"],
#             "updated_at"     : datetime.utcnow()
#         }

#         # Check if session exists
#         existing = interview_sessions.find_one({"_id": ObjectId(session_id)})

#         if existing:
#             interview_sessions.update_one(
#                 {"_id": ObjectId(session_id)},
#                 {
#                     "$set": {
#                         f"phone_detection.{question_id}": phone_obj,
#                         "updated_at": datetime.utcnow()
#                     }
#                 }
#             )
#         else:
#             raise HTTPException(status_code=404, detail="Session not found")

#         return {
#             "status"     : "success",
    #         "session_id" : session_id,
    #         "question_id": question_id,
    #         **results
    #     }

    # finally:
    #     if os.path.exists(temp_path):
    #         os.remove(temp_path)
    
async def analyze_phone_usage(file: UploadFile, session_id: str, question_id: str):
    await file.seek(0)
    if not file.filename.endswith(('.mp4', '.avi', '.mov', '.mkv', '.webm')):
        raise HTTPException(status_code=400, detail="Invalid video format")

    temp_path = f"uploads/{session_id}_{question_id}_{file.filename}"
    os.makedirs("uploads", exist_ok=True)

    try:
        # Save uploaded video
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        try:
            results = predictor.predict(temp_path)
        except Exception as e:
            print(f"❌ Predictor failed: {str(e)}")
            return {
                "status": "warning",
                "message": "AI model could not process this video file",
                "detail": str(e)
            }
        # ---------------------------------------

        # Object to store under phone_detection
        phone_obj = {
            "is_cheating"    : results["summary"]["is_cheating"],
            "severity"       : results["summary"]["severity"],
            "cheating_events": results["cheating_events"],
            "summary"        : results["summary"],
            "per_frame"      : results["per_frame"],
            "updated_at"     : datetime.utcnow()
        }

        # Check if session exists
        existing = interview_sessions.find_one({"_id": ObjectId(session_id)})

        if existing:
            interview_sessions.update_one(
                {"_id": ObjectId(session_id)},
                {
                    "$set": {
                        f"phone_detection.{question_id}": phone_obj,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
        else:
            raise HTTPException(status_code=404, detail="Session not found")

        return {
            "status"     : "success",
            "session_id" : session_id,
            "question_id": question_id,
            **results
        }

    except Exception as general_e:
        print(f"❌ General Error in analyze_phone_usage: {str(general_e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error during analysis")

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


async def get_cheating_report(session_id: str = Query(...)):
    # 🔹 Convert session_id to ObjectId
    try:
        obj_id = ObjectId(session_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid session_id format")

    # 🔹 Find session by _id
    session_data = interview_sessions.find_one({"_id": obj_id})
    if not session_data:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")

    # 🔹 Get phone_detection object
    questions = session_data.get("phone_detection", {})

    # 🔹 Count cheating questions
    cheating_qs = [q for q, v in questions.items() if v.get("is_cheating")]

    return {
        "session_id"              : session_id,
        "overall_cheating"        : len(cheating_qs) > 0,
        "questions_with_cheating" : len(cheating_qs),
        "total_questions_analyzed": len(questions),
        "questions"               : questions,
    }