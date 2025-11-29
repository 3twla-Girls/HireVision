from fastapi import APIRouter
from controllers.QuestionGeneration_controller import generate_questions_service
from controllers.AnswerGeneration_controller import generate_answers_service
from models.job_info import JobInfo
import models.model_factory as model_factory


router = APIRouter()

@router.post("/generate-questions")
async def generate_questions(job_info: JobInfo):
    """Generate interview questions only"""
    result = generate_questions_service(
        job_title=job_info.job_title,
        skills=job_info.skills,
        experience_level=job_info.experience_level,
        num_questions=job_info.num_questions,
        model_key=model_factory.ModelFactory.active_model_key
    )

    return {"questions": result}


@router.post("/generate-questions-with-answers")
async def generate_questions_with_answers(job_info: JobInfo):
    """Generate questions and their reference answers in one call"""
    
    # Step 1: Generate questions
    questions_result = generate_questions_service(
        job_title=job_info.job_title,
        skills=job_info.skills,
        experience_level=job_info.experience_level,
        num_questions=job_info.num_questions,
        model_key=model_factory.ModelFactory.active_model_key
    )
    
    # Step 2: Generate answers for those questions
    if "questions" in questions_result and questions_result["questions"]:
        answers_result = generate_answers_service(
            questions=questions_result["questions"],
            job_title=job_info.job_title,
            skills=job_info.skills,
            experience_level=job_info.experience_level,
            model_key=model_factory.ModelFactory.active_model_key
        )
        
        # Merge questions with their answers
        questions_with_answers = []
        for question in questions_result["questions"]:
            q_id = question["id"]
            # Find matching answer
            answer = next(
                (a for a in answers_result.get("answers", []) if a["question_id"] == q_id),
                None
            )
            
            questions_with_answers.append({
                **question,
                "question_type": answer["question_type"] if answer else "unknown",
                "reference_answer": answer["reference_answer"] if answer else None
            })
        
        return {
            "questions_with_answers": questions_with_answers,
            "metadata": {
                "job_title": job_info.job_title,
                "skills": job_info.skills,
                "experience_level": job_info.experience_level,
                "total_questions": len(questions_with_answers)
            }
        }
    
    return {"error": "Failed to generate questions", "details": questions_result}