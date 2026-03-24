# ============================================================================
# IMPORTS
# ============================================================================
import os
from datetime import datetime
from typing import Optional, Dict, Any
from bson import ObjectId

from .BaseController import BaseController
from ..models.enums.DataBaseEnum import DataBaseEnum
from .ProctoringController import ProctoringController

# Module 3 (Interview & Evaluation)
from Module_3.STT.controllers.stt_controller import transcribe_video
from Module_3.Answer_Evaluation.evaluator import (
    evaluate_single_answer,
    generate_final_summary
)

from Module2.userAuthn.config import (
    SCRIPT_DIR
)


# ============================================================================
# INTERVIEW CONTROLLER
# ============================================================================
class InterviewController(BaseController):

    def __init__(self, db_client=None):
        super().__init__()
        self.db_client = db_client
        self.sessions_collection = None
        self.questions_collection = None

    @classmethod
    async def create_instance(cls, db_client):
        """Create and initialize an InterviewController instance."""
        instance = cls(db_client=db_client)
        await instance.init_collections()
        return instance

    async def init_collections(self):
        """Initialize database collections for interviews and questions."""
        self.sessions_collection = self.db_client[
            DataBaseEnum.COLLECTION_INTERVIEW_SESSIONS_NAME.value
        ]
        self.questions_collection = self.db_client[
            DataBaseEnum.COLLECTION_QUESTIONS_WITH_ANSWERS_NAME.value
        ]

    # ========== CREATE ==========
    async def start_session(self, candidate_id: str, job_id: Optional[str] = None, is_mock: bool = False, job_title: Optional[str] = None) -> Dict[str, Any]:
        session = {
            "candidate_id": candidate_id,
            "job_id": job_id,
            "job_title": job_title,
            "is_mock": is_mock,
            "session_date": datetime.utcnow(),
            "answers": [],
            "final_summary": {
                "technical": None,
                "integrity": {
                    "face_auth": None,
                    "eye_gaze": None 
                },
                "personality": None
            }
        }

        result = await self.sessions_collection.insert_one(session)
        session_id = str(result.inserted_id)

        ProctoringController._get_or_init_session(session_id) 
        
        path = os.path.join(SCRIPT_DIR, "embeddings", f"ref_{session_id}.npy")
        if os.path.exists(path):
            os.remove(path)
        # ------------------------------------------------

        return {
            "status": "session_started",
            "session_id": session_id
        }

    # ========== READ ==========
    async def get_questions(self, job_id: str) -> Dict[str, Any]:
        cursor = self.questions_collection.find(
            {"job_id": ObjectId(job_id)}
        ).sort("created_at", -1).limit(1)

        results = await cursor.to_list(length=1)
        job_questions = results[0] if results else None

        if not job_questions:
            raise Exception(f"No questions found for ID {job_id}")

        questions = job_questions.get("questions_w_answers", [])

        # Convert ObjectId to string for API response
        for q in questions:
            q_id = q.get("question_id")
            q["question_id"] = str(q_id) if q_id else ""

        return {
            "job_id": job_id,
            "questions": questions
        }

    async def get_session(self, session_id: str) -> Dict[str, Any]:
        session = await self.sessions_collection.find_one(
            {"_id": ObjectId(session_id)}
        )

        if not session:
            raise Exception(f"Session {session_id} not found")

        # Convert ObjectId to string
        session["_id"] = str(session["_id"])
        for ans in session.get("answers", []):
            ans["question_id"] = str(ans.get("question_id", ""))

        return session

    async def get_sessions_by_candidate(self, candidate_id: str) -> list:
        cursor = self.sessions_collection.find(
            {"candidate_id": candidate_id}
        ).sort("session_date", -1)

        sessions = await cursor.to_list(length=None)
        for s in sessions:
            s["_id"] = str(s["_id"])
            s["candidate_id"] = str(s["candidate_id"])
            if s.get("job_id"):
                s["job_id"] = str(s["job_id"])
            for ans in s.get("answers", []):
                if ans.get("question_id"):
                    ans["question_id"] = str(ans["question_id"])

        return sessions


    # ========== UPDATE ==========
    async def submit_answer(
        self,
        session_id: str,
        question_id: str,
        file
    ) -> Dict[str, Any]:
        # Step 1: Convert video/audio to text
        speech_to_text = await transcribe_video(file)

        # Step 2: Retrieve the question from DB
        job_questions = await self.questions_collection.find_one({
            "questions_w_answers.question_id": ObjectId(question_id)
        })

        if not job_questions:
            raise Exception(f"Question {question_id} not found")

        # Step 3: Extract specific question data
        question_data = None
        for q in job_questions.get("questions_w_answers", []):
            if q["question_id"] == ObjectId(question_id):
                question_data = q
                break

        if not question_data:
            raise Exception(f"Question {question_id} not found in job")

        question_text = question_data.get("question", "")
        correct_answer = question_data.get("reference_answer", "")

        # Step 4: Evaluate the answer
        evaluation = evaluate_single_answer(
            question_text,
            correct_answer,
            speech_to_text
        )

        # Step 5: Save answer in DB
        answer_doc = {
            "question_id": ObjectId(question_id),
            "speech_to_text": speech_to_text,
            "evaluation": evaluation
        }

        result = await self.sessions_collection.update_one(
            {"_id": ObjectId(session_id)},
            {"$push": {"answers": answer_doc}}
        )

        if result.matched_count == 0:
            raise Exception(f"Session {session_id} not found")

        return {
            "status": "answer_saved",
            "transcription": speech_to_text,
            "evaluation": evaluation
        }

    # async def generate_summary(self, session_id: str) -> Dict[str, Any]:
    #     session = await self.sessions_collection.find_one(
    #         {"_id": ObjectId(session_id)}
    #     )

    #     if not session:
    #         raise Exception(f"Session {session_id} not found")

    #     # Extract evaluations from all answers
    #     evaluations = [
    #         ans["evaluation"]
    #         for ans in session.get("answers", [])
    #         if "evaluation" in ans
    #     ]

    #     # Generate summary using Module 3 evaluator
    #     summary = generate_final_summary(evaluations)

    #     # Update session with final summary
    #     await self.sessions_collection.update_one(
    #         {"_id": ObjectId(session_id)},
    #         {"$set": {"final_summary": summary}}
    #     )

    #     return {
    #         "status": "summary_generated",
    #         "summary": summary
    #     }
        
    async def generate_summary(self, session_id: str) -> Dict[str, Any]:
        session = await self.sessions_collection.find_one(
            {"_id": ObjectId(session_id)}
        )

        if not session:
            raise Exception(f"Session {session_id} not found")

        evaluations = [
            ans["evaluation"]
            for ans in session.get("answers", [])
            if "evaluation" in ans
        ]

        technical_summary = generate_final_summary(evaluations)

        from .ProctoringController import ProctoringController
        proc_data = ProctoringController.active_sessions.get(session_id, {})
        
        face_auth_report = {
            "status": "Passed" if proc_data.get("diff_miss_count", 0) < 3 else "Suspected",
            "incidents_count": len(proc_data.get("incidents", [])),
            "incidents": proc_data.get("incidents", []),
            "counts": {
                "different_person": proc_data.get("diff_miss_count", 0),
                "no_face": proc_data.get("gone_miss_count", 0),
                "multiple_faces": proc_data.get("multi_miss_count", 0)
            }
        }

        update_query = {
            "$set": {
                "final_summary.technical": technical_summary,
                "final_summary.integrity.face_auth": face_auth_report,
                "final_summary.personality": {"status": "Pending Analysis"}
            }
        }

        await self.sessions_collection.update_one(
            {"_id": ObjectId(session_id)},
            update_query
        )

        try:
            proc_controller = await ProctoringController.create_instance()
            proc_controller.end_session(session_id)
        except Exception as e:
            print(f"Cleanup warning: {e}")

        updated_session = await self.sessions_collection.find_one({"_id": ObjectId(session_id)})

        return {
            "status": "summary_generated",
            "session_id": session_id,
            "summary": updated_session.get("final_summary")
        }