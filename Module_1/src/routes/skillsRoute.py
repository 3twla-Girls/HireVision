from fastapi import APIRouter, Form, status, Depends, UploadFile, File
from fastapi.responses import JSONResponse
import logging
import os
import json
from typing import List
from collections import Counter, defaultdict

import pandas as pd
from pydantic import BaseModel
from sklearn.metrics import normalized_mutual_info_score
from ..controllers.SkillsExtractionController import SkillsController
from ..controllers.CandidateClusteringController import CandidateClusteringController
from Server.helpers.config import get_settings, Settings
from ..helpers.faiss_service import FAISSService
from ..helpers.app_factory import create_app_services

logger = logging.getLogger("uvicorn.error")

skills_router = APIRouter(
    prefix="/api/v1/skills",
    tags=["api_v1", "skills"],
)


CLUSTER_FILE = "./Module_1/faiss_store/candidate_clusters.pkl"

# -------------------------------
# Request/Response Models
# -------------------------------
class CandidateClusterRequest(BaseModel):
    candidate_id: str
    job_role_embedding: List[float]
    skills_embeddings: List[List[float]]


class CandidateClusterResponse(BaseModel):
    cluster_id: int
    similar_candidates: List[str]

# -------------------------------
# Helper function for clustering
# -------------------------------
def cluster_candidate(data: CandidateClusterRequest,clustering_controller:CandidateClusteringController) -> CandidateClusterResponse:
    
    # Cluster the candidate
    cluster_id = clustering_controller.cluster_candidate(
        candidate_id=data.candidate_id,
        job_role_embedding=data.job_role_embedding,
        skills_embeddings=data.skills_embeddings
    )
    
    # Save clusters after each addition
    clustering_controller.save_clusters(CLUSTER_FILE)
    
    # Get similar candidates in the same cluster
    similar_candidates = clustering_controller.get_similar_candidates(cluster_id)

    return CandidateClusterResponse(
        cluster_id=cluster_id,
        similar_candidates=similar_candidates
    )





#==================================================evaluation metrics==================================================
# def calculate_inverse_purity(true_labels, cluster_labels):
#     true_groups = defaultdict(set)
#     for idx, label in enumerate(true_labels):
#         true_groups[label].add(idx)

#     cluster_groups = defaultdict(set)
#     for idx, cluster in enumerate(cluster_labels):
#         cluster_groups[cluster].add(idx)

#     correct = 0
#     for t_group in true_groups.values():
#         max_overlap = 0
#         for c_group in cluster_groups.values():
#             overlap = len(t_group & c_group)
#             max_overlap = max(max_overlap, overlap)
#         correct += max_overlap

#     return correct / len(true_labels)



# -------------------------------
# Optional: Endpoint for evaluation
# -------------------------------
# @skills_router.post("/evaluate_clustering")
# async def evaluate_clustering(file: UploadFile = File(...)):
#     """
#     Evaluate clustering quality using a CSV containing:
#     file_id, resume_text, job_title
#     """
#     try:
#         df = pd.read_csv(file.file)

#         required_cols = {"job Id","Job Title", "Job Description"}
#         if not required_cols.issubset(df.columns):
#             return JSONResponse(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 content={"error": f"CSV must contain columns {required_cols}"}
#             )

#         true_labels = []
#         cluster_labels = []

#         for _, row in df.iterrows():
#             file_id = str(row["job Id"])
#             cv_text = row["Job Description"]
#             job_title = row["Job Title"]

#             # ---- Process CV ----
#             filtered_result = skills_controller.process_cv(cv_text=cv_text)
#             if not filtered_result.get("skills_embeddings"):
#                 continue

#             job_embedding = skills_controller.model.embed_job_roles(job_title)[0].tolist()

#             data = CandidateClusterRequest(
#                 candidate_id=file_id,
#                 job_role_embedding=job_embedding,
#                 skills_embeddings=filtered_result["skills_embeddings"]
#             )

#             clustering_result = cluster_candidate(data=data)

#             true_labels.append(job_title)
#             cluster_labels.append(clustering_result.cluster_id)

#         if not true_labels:
#             return JSONResponse(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 content={"error": "No valid CVs processed"}
#             )


#         score1 = calculate_inverse_purity(true_labels, cluster_labels)
#         score3=normalized_mutual_info_score(true_labels, cluster_labels)
#         print(f"Inverse Purity: {score1:.3f}")
#         print(f"NMI: {score3:.3f}")
        
#         return JSONResponse(
#             status_code=status.HTTP_200_OK,
#             content={
#                 "signal": "EVALUATION_SUCCESS",
#                 "total_samples": len(true_labels),
#                 "purity": round(score1, 4),
#                 "NMI": round(score3, 4),
#                 "interpretation": (
#                     "Closer to 1 → candidates of same job roles grouped together well"
#                 )
#             }
#         )

#     except Exception as e:
#         return JSONResponse(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             content={"error": str(e)}
#         )
