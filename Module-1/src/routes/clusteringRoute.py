from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from fastapi import APIRouter, Form, status, Depends
from fastapi.responses import JSONResponse
import logging
from controllers.CandidateClusteringController import CandidateClusteringController

logger = logging.getLogger("uvicorn.error")

clustering_router = APIRouter(
    prefix="/api/v1/clustering",
    tags=["api_v1", "clustering"],
)

router = APIRouter()

# Initialize controller once 
clustering_controller = CandidateClusteringController()


# -------------------------------
# Request Model
# -------------------------------
class CandidateClusterRequest(BaseModel):
    candidate_id: str
    job_embedding: List[float]
    skills_embeddings: List[List[float]]


# -------------------------------
# Response Model
# -------------------------------
class CandidateClusterResponse(BaseModel):
    cluster_id: int
    similar_candidates: List[str]


# -------------------------------
# Endpoint
# -------------------------------
@router.post("/cluster_candidate", response_model=CandidateClusterResponse)
def cluster_candidate(data: CandidateClusterRequest):
    """
    Cluster a candidate based on job title + skills embeddings
    """

    cluster_id = clustering_controller.cluster_candidate(
        candidate_id=data.candidate_id,
        job_embedding=data.job_embedding,
        skills_embeddings=data.skills_embeddings
    )

    similar_candidates = clustering_controller.get_similar_candidates(cluster_id)

    return CandidateClusterResponse(
        cluster_id=cluster_id,
        similar_candidates=similar_candidates
    )
