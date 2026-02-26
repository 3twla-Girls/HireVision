from fastapi import APIRouter
from pydantic import BaseModel
import evaluator

router = APIRouter()

# Request Models 
class SingleEvaluationRequest(BaseModel):
    question: str
    correct_answer: str
    candidate_answer: str
class FinalSummaryRequest(BaseModel):
    evaluations_list: list


# Evaluate One Answer
@router.post("/answer-evaluation")
async def answer_evaluation(payload: SingleEvaluationRequest):
    """
    Uses Prompt A to evaluate one answer.
    """
    result = evaluator.evaluate_single_answer(
        question=payload.question,
        correct_answer=payload.correct_answer,
        candidate_answer=payload.candidate_answer
    )
    return result


# Generate Final Summary
@router.post("/final-summary")
async def final_summary(payload: FinalSummaryRequest):
    """
    Uses Prompt B to generate the final interview summary.
    """
    result = evaluator.generate_final_summary(
        evaluations_list=payload.evaluations_list
    )
    return result
