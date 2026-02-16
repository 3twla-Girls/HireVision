from fastapi import APIRouter, Form, status, Depends,UploadFile, File
from fastapi.responses import JSONResponse
import logging
import os
import json
from Module_1.src.controllers.SkillsExtractionController import SkillsController
from ..controllers import ProcessController
from typing import List
from pydantic import BaseModel
from ..helpers.config import get_settings, Settings
import pandas as pd
from sklearn.metrics import adjusted_rand_score, normalized_mutual_info_score
from collections import Counter, defaultdict
from Module_1.src.controllers.CandidateClusteringController import CandidateClusteringController

logger = logging.getLogger("uvicorn.error")

skills_router = APIRouter(
    prefix="/api/v1/skills",
    tags=["api_v1", "skills"],
)

# -----------------------------
# Initialize SkillsController once
# -----------------------------
skills_controller = SkillsController(
    embedding_model_name="mixedbread-ai/mxbai-embed-large-v1",
    verbose=True
)

# -----------------------------
# Initialize clustering controller
# -----------------------------
CLUSTER_FILE = "./Module_1/src/candidate_clusters.pkl"
JSON_FILE = "./job_role_skills_embeddings.json"

clustering_controller = CandidateClusteringController(
    embedding_dim=1024,  # mxbai-embed-large-v1 dimension
    threshold=0.95  # Adjust between 0.80-0.90 based on your needs
)

# Try to load existing clusters first
cluster_loaded = False
if os.path.exists(CLUSTER_FILE):
    try:
        clustering_controller.load_clusters(CLUSTER_FILE)
        logger.info(f"✅ Loaded existing clusters from {CLUSTER_FILE}")
        cluster_loaded = True
    except Exception as e:
        logger.warning(f"⚠️ Could not load clusters: {e}. Will initialize from JSON.")

# If no clusters loaded and JSON file exists, initialize from JSON
if not cluster_loaded and os.path.exists(JSON_FILE):
    try:
        logger.info(f"📂 Initializing clusters from {JSON_FILE}...")
        
        with open(JSON_FILE, "r") as f:
            all_results = json.load(f)
        
        logger.info(f"Found {len(all_results)} job roles in JSON")
        
        successful = 0
        failed = 0
        
        for idx, item in enumerate(all_results):
            try:
                job_role = item.get("job_role", f"unknown_{idx}")
                job_embedding = item.get("job_role_embedding", [])
                skills_embeddings = item.get("skills_embeddings", [])
                
                # Validate we have data
                if not job_embedding:
                    logger.warning(f"⚠️ Skipping {job_role}: No job embedding")
                    failed += 1
                    continue
                
                clustering_controller.cluster_candidate(
                    candidate_id=f"job_{job_role}",
                    job_role_embedding=job_embedding,
                    skills_embeddings=skills_embeddings
                )
                successful += 1
                
                # Log progress every 10 jobs
                if (idx + 1) % 10 == 0:
                    logger.info(f"Progress: {idx + 1}/{len(all_results)} jobs processed")
                
            except Exception as e:
                logger.error(f"❌ Error clustering preset job '{job_role}': {e}")
                failed += 1
                continue
        
        # Save the initialized clusters
        clustering_controller.save_clusters(CLUSTER_FILE)
        logger.info(f"✅ Initialized {successful} job roles ({failed} failed)")
        
    except FileNotFoundError:
        logger.warning(f"⚠️ JSON file not found: {JSON_FILE}")
    except json.JSONDecodeError as e:
        logger.error(f"❌ Invalid JSON format in {JSON_FILE}: {e}")
    except Exception as e:
        logger.error(f"❌ Error initializing from JSON: {e}")

# If still no clusters, start fresh
if clustering_controller.model.next_cluster_id == 0:
    logger.info("Starting with empty cluster system")


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


# -----------------------------
# Endpoint: Process single CV
# -----------------------------
@skills_router.post("/process_cv/{project_id}/{file_id}")
async def process_cv(project_id: str, file_id: str, job_role: str = Form(...)):
    """
    Process a CV: extract skills, generate embeddings, and cluster the candidate
    """

    # -----------------------------
    # 1) Get CV content
    # -----------------------------
    try:
        cv_text = ProcessController(project_id=project_id).get_file_content(file_id=file_id)
        if not cv_text:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"signal": "FILE_NOT_FOUND", "file_id": file_id}
            )
    except Exception as e:
        logger.error(f"Error fetching file content ({file_id}): {e}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"signal": "FILE_FETCH_FAILED", "error": str(e)}
        )

    # -----------------------------
    # 2) Extract skills + embeddings
    # -----------------------------
    try:
        filtered_result = skills_controller.process_cv(cv_text=cv_text)
        
        # Check if any skills were found
        if not filtered_result.get("skills") or not filtered_result.get("skills_embeddings"):
            logger.warning(f"No skills found in CV {file_id}")
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={
                    "signal": "NO_SKILLS_FOUND", 
                    "file_id": file_id,
                    "message": "No matching skills found in CV",
                    "data": {
                        "skills": [],
                        "job_role": job_role,
                        "cluster_id": None,
                        "similar_candidates": [],
                        "cluster_size": 0
                    }
                }
            )
        
        logger.info(f"Extracted {len(filtered_result['skills'])} skills from {file_id}")
        
    except Exception as e:
        logger.error(f"Error processing CV ({file_id}): {e}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"signal": "PROCESSING_FAILED", "error": str(e)}
        )
    
    # -----------------------------
    # 3) Embed job role & cluster the candidate
    # -----------------------------
    try:
        # Embed job role
        job_embedding = skills_controller.model.embed_job_roles(job_role)[0].tolist()
        
        data = CandidateClusterRequest(
            candidate_id=file_id,
            job_role_embedding=job_embedding,
            skills_embeddings=filtered_result["skills_embeddings"]
        )

        clustering_result = cluster_candidate(data=data)

        response = {
            "skills": filtered_result["skills"],
            "job_role": job_role,
            "cluster_id": clustering_result.cluster_id,
            "similar_candidates": clustering_result.similar_candidates,
            "cluster_size": len(clustering_result.similar_candidates)
        }
        
        logger.info(f"Candidate {file_id} assigned to cluster {clustering_result.cluster_id}")

    except Exception as e:
        logger.error(f"Error clustering candidate ({file_id}): {e}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"signal": "CLUSTERING_FAILED", "error": str(e)}
        )
    
    # -----------------------------
    # 4) Return response
    # -----------------------------
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"signal": "SUCCESS", "file_id": file_id, "data": response}
    )


# -------------------------------
# Helper function for clustering
# -------------------------------
def cluster_candidate(data: CandidateClusterRequest) -> CandidateClusterResponse:
    
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


# -------------------------------
# Optional: Endpoint to view cluster stats
# -------------------------------
@skills_router.get("/cluster_stats")
async def get_cluster_stats():
    """Get statistics about current clusters"""
    stats = clustering_controller.model.get_cluster_stats()
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"signal": "SUCCESS", "data": stats}
    )


# -------------------------------
# Optional: Endpoint to get cluster details
# -------------------------------
@skills_router.get("/cluster/{cluster_id}")
async def get_cluster_details(cluster_id: int):
    """Get all candidates in a specific cluster"""
    candidates = clustering_controller.get_similar_candidates(cluster_id)
    
    if not candidates:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"signal": "CLUSTER_NOT_FOUND", "cluster_id": cluster_id}
        )
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "signal": "SUCCESS",
            "cluster_id": cluster_id,
            "candidates": candidates,
            "count": len(candidates)
        }
    )


# -------------------------------
# Optional: Endpoint to reset clusters
# -------------------------------
@skills_router.post("/reset_clusters")
async def reset_clusters():
    """Reset all clusters (use with caution!)"""
    global clustering_controller
    clustering_controller = CandidateClusteringController(
        embedding_dim=1024,
        threshold=0.85
    )
    
    if os.path.exists(CLUSTER_FILE):
        os.remove(CLUSTER_FILE)
    
    logger.info("🔄 Clusters reset")
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"signal": "SUCCESS", "message": "Clusters reset"}
    )


# -------------------------------
# Optional: Endpoint to reinitialize from JSON
# -------------------------------
@skills_router.post("/reinitialize_clusters")
async def reinitialize_clusters():
    """Reinitialize clusters from JSON file"""
    global clustering_controller
    
    # Reset clusters
    clustering_controller = CandidateClusteringController(
        embedding_dim=1024,
        threshold=0.85
    )
    
    if not os.path.exists(JSON_FILE):
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"signal": "JSON_FILE_NOT_FOUND", "path": JSON_FILE}
        )
    
    try:
        with open(JSON_FILE, "r") as f:
            all_results = json.load(f)
        
        successful = 0
        failed = 0
        
        for idx, item in enumerate(all_results):
            try:
                job_role = item.get("job_role", f"unknown_{idx}")
                job_embedding = item.get("job_role_embedding", [])
                skills_embeddings = item.get("skills_embeddings", [])
                
                if not job_embedding:
                    failed += 1
                    continue
                
                clustering_controller.cluster_candidate(
                    candidate_id=f"preset_{job_role}",
                    job_role_embedding=job_embedding,
                    skills_embeddings=skills_embeddings
                )
                successful += 1
                
            except Exception as e:
                logger.error(f"Error clustering preset job '{job_role}': {e}")
                failed += 1
        
        clustering_controller.save_clusters(CLUSTER_FILE)
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "signal": "SUCCESS",
                "message": f"Reinitialized {successful} job roles",
                "successful": successful,
                "failed": failed
            }
        )
        
    except Exception as e:
        logger.error(f"Error reinitializing clusters: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"signal": "REINITIALIZATION_FAILED", "error": str(e)}
        )
        

def calculate_inverse_purity(true_labels, cluster_labels):
    true_groups = defaultdict(set)
    for idx, label in enumerate(true_labels):
        true_groups[label].add(idx)

    cluster_groups = defaultdict(set)
    for idx, cluster in enumerate(cluster_labels):
        cluster_groups[cluster].add(idx)

    correct = 0
    for t_group in true_groups.values():
        max_overlap = 0
        for c_group in cluster_groups.values():
            overlap = len(t_group & c_group)
            max_overlap = max(max_overlap, overlap)
        correct += max_overlap

    return correct / len(true_labels)



# -------------------------------
# Optional: Endpoint for evaluation
# -------------------------------
@skills_router.post("/evaluate_clustering")
async def evaluate_clustering(file: UploadFile = File(...)):
    """
    Evaluate clustering quality using a CSV containing:
    file_id, resume_text, job_title
    """
    try:
        df = pd.read_csv(file.file)

        required_cols = {"job Id","Job Title", "Job Description"}
        if not required_cols.issubset(df.columns):
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"error": f"CSV must contain columns {required_cols}"}
            )

        true_labels = []
        cluster_labels = []

        for _, row in df.iterrows():
            file_id = str(row["job Id"])
            cv_text = row["Job Description"]
            job_title = row["Job Title"]

            # ---- Process CV ----
            filtered_result = skills_controller.process_cv(cv_text=cv_text)
            if not filtered_result.get("skills_embeddings"):
                continue

            job_embedding = skills_controller.model.embed_job_roles(job_title)[0].tolist()

            data = CandidateClusterRequest(
                candidate_id=file_id,
                job_role_embedding=job_embedding,
                skills_embeddings=filtered_result["skills_embeddings"]
            )

            clustering_result = cluster_candidate(data=data)

            true_labels.append(job_title)
            cluster_labels.append(clustering_result.cluster_id)

        if not true_labels:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"error": "No valid CVs processed"}
            )


        score1 = calculate_inverse_purity(true_labels, cluster_labels)
        score3=normalized_mutual_info_score(true_labels, cluster_labels)
        print(f"Inverse Purity: {score1:.3f}")
        print(f"NMI: {score3:.3f}")
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "signal": "EVALUATION_SUCCESS",
                "total_samples": len(true_labels),
                "purity": round(score1, 4),
                "NMI": round(score3, 4),
                "interpretation": (
                    "Closer to 1 → candidates of same job roles grouped together well"
                )
            }
        )

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": str(e)}
        )
