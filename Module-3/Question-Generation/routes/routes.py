from fastapi import APIRouter
from controllers.QuestionGeneration_controller import generate_questions_service
from controllers.AnswerGeneration_controller import generate_answers_service
from models.job_info import JobInfo
import models.model_factory as model_factory
from fastapi import Response



router = APIRouter()

@router.post("/generate-questions")
async def generate_questions(job_info: JobInfo, response: Response):
    """Generate interview questions only"""
    
    result = generate_questions_service(
        job_title=job_info.job_title,
        skills=job_info.skills,
        experience_level=job_info.experience_level,
        num_questions=job_info.num_questions,
        model_key=model_factory.ModelFactory.active_model_key
    )
    
    token_usage = result.get("token_usage", {})
    total_tokens = token_usage.get("total_tokens", 0)
    
    response.headers["X-Total-Tokens"] = str(total_tokens)
    response.headers["X-Prompt-Tokens"] = str(token_usage.get("prompt_tokens", 0))
    response.headers["X-Completion-Tokens"] = str(token_usage.get("completion_tokens", 0))
    
    return {
        "questions": result.get("questions", []),
    }



@router.post("/generate-questions-with-answers")
async def generate_questions_with_answers(job_info: JobInfo, response: Response):
    
    # Step 1: Generate questions
    questions_result = generate_questions_service(
        job_title=job_info.job_title,
        skills=job_info.skills,
        experience_level=job_info.experience_level,
        num_questions=job_info.num_questions,
        model_key=model_factory.ModelFactory.active_model_key
    )

    q_tokens = questions_result.get("token_usage", {})
    total_tokens = q_tokens.get("total_tokens", 0)

    answers_result = generate_answers_service(
        questions=questions_result.get("questions", []),
        job_title=job_info.job_title,
        skills=job_info.skills,
        experience_level=job_info.experience_level,
        model_key=model_factory.ModelFactory.active_model_key
    )
    a_tokens = answers_result.get("token_usage", {})
    total_tokens += a_tokens.get("total_tokens", 0)

    questions_with_answers = []
    for question in questions_result.get("questions", []):
        q_id = question["id"]
        answer = next((a for a in answers_result.get("answers", []) if a["question_id"] == q_id), None)
        questions_with_answers.append({
            **question,
            "question_type": answer["question_type"] if answer else question.get("type", "unknown"),
            "reference_answer": answer["reference_answer"] if answer else None
        })

    # Add custom headers
    response.headers["X-Total-Tokens"] = str(total_tokens)
    response.headers["X-Prompt-Tokens"] = str(q_tokens.get("prompt_tokens", 0) + a_tokens.get("prompt_tokens", 0))
    response.headers["X-Completion-Tokens"] = str(q_tokens.get("completion_tokens", 0) + a_tokens.get("completion_tokens", 0))

    return {
        "questions_with_answers": questions_with_answers,
    }
