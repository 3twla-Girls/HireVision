from fastapi import APIRouter, Response
from Question_Generation.controllers.QuestionGeneration_controller import generate_questions_service
from Question_Generation.controllers.AnswerGeneration_controller import generate_answers_service
from Question_Generation.models.job_info import JobInfo
import Question_Generation.models.model_factory as model_factory

# Repository
from DB.repositories.job_repo import create_job

router = APIRouter()


@router.post("/generate-questions")
async def generate_questions(job_info: JobInfo, response: Response):
    """
    Step 1: Save job to DB
    Step 2: Generate questions
    """

    # 🔹 Save job first
    job_id = create_job(
        job_role=job_info.job_title,
        skills=job_info.skills,
        experience_level=job_info.experience_level
    )

    # 🔹 Generate questions
    result = generate_questions_service(
        job_id=job_id,
        num_questions=job_info.num_questions,
        model_key=model_factory.ModelFactory.active_model_key
    )

    token_usage = result.get("token_usage", {})

    # 🔹 Token headers
    response.headers["X-Total-Tokens"] = str(token_usage.get("total_tokens", 0))
    response.headers["X-Prompt-Tokens"] = str(token_usage.get("prompt_tokens", 0))
    response.headers["X-Completion-Tokens"] = str(token_usage.get("completion_tokens", 0))

    return {
        "job_id": job_id,
        "questions": result.get("questions", [])
    }


@router.post("/generate-questions-with-answers")
async def generate_questions_with_answers(job_info: JobInfo, response: Response):

    # 🔹 Step 1: Save job
    job_id = create_job(
        job_role=job_info.job_title,
        skills=job_info.skills,
        experience_level=job_info.experience_level
    )

    # 🔹 Step 2: Generate questions
    questions_result = generate_questions_service(
        job_id=job_id,
        num_questions=job_info.num_questions,
        model_key=model_factory.ModelFactory.active_model_key
    )

    q_tokens = questions_result.get("token_usage", {})
    total_tokens = q_tokens.get("total_tokens", 0)

    # 🔹 Step 3: Generate answers
    answers_result = generate_answers_service(
        job_id=job_id,
        questions=questions_result.get("questions", []),
        model_key=model_factory.ModelFactory.active_model_key
    )

    a_tokens = answers_result.get("token_usage", {})
    total_tokens += a_tokens.get("total_tokens", 0)

    # 🔹 Merge Q + A
    questions_with_answers = []

    for question in questions_result.get("questions", []):
        q_id = question["id"]

        answer = next(
            (a for a in answers_result.get("answers", [])
             if a["question_id"] == q_id),
            None
        )

        questions_with_answers.append({
            **question,
            "question_type": answer["question_type"] if answer else question.get("type", "unknown"),
            "reference_answer": answer["reference_answer"] if answer else None
        })

    # 🔹 Token headers
    response.headers["X-Total-Tokens"] = str(total_tokens)
    response.headers["X-Prompt-Tokens"] = str(
        q_tokens.get("prompt_tokens", 0) +
        a_tokens.get("prompt_tokens", 0)
    )
    response.headers["X-Completion-Tokens"] = str(
        q_tokens.get("completion_tokens", 0) +
        a_tokens.get("completion_tokens", 0)
    )

    return {
        "job_id": job_id,
        "questions_with_answers": questions_with_answers
    }
