"""
Router for Model Selection endpoint.
"""
from fastapi import APIRouter, HTTPException
from schemas import ModelSelectionRequest, ModelSelectionResponse, ModelRanking
import selector

router = APIRouter()

@router.post("/select-best-model", response_model=ModelSelectionResponse)
async def select_best_model(req: ModelSelectionRequest):
    """
    Evaluates all available models for the given job context and returns
    the one that generates the most "natural" (lowest perplexity) questions.
    """
    rankings_data = selector.evaluate_models(
        job_title=req.job_title,
        skills=req.skills,
        experience_level=req.experience_level,
        num_questions=req.num_questions
    )
    
    if not rankings_data:
        raise HTTPException(status_code=500, detail="No models could be evaluated.")
        
    rankings = [
        ModelRanking(
            model_key=r["model_key"],
            mean_perplexity=r["mean_perplexity"],
            perplexities=r["perplexities"],
            sample_questions=r["sample_questions"]
        )
        for r in rankings_data
    ]
    
    best_model = rankings[0].model_key
    
    return ModelSelectionResponse(
        best_model=best_model,
        rankings=rankings,
        job_title=req.job_title
    )
