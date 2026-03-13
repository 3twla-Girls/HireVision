import sys
import os
import logging
import importlib.util
import types
import tempfile

from fastapi import APIRouter, Depends, UploadFile, Form, status, Request
from fastapi.responses import JSONResponse
from bson import ObjectId

from ..helpers.config import get_settings, Settings
from ..controllers import DataController, ProcessController
from ..models import ResponseSignal
from ..models.CVModel import CVModel, CV
from ..models.UserModel import UserModel

logger = logging.getLogger('uvicorn.error')

from Module_1.src.controllers.SkillsExtractionController import SkillsController
from Module_1.src.controllers.CandidateClusteringController import CandidateClusteringController
from Module_1.src.routes.skillsRoute import cluster_candidate, CandidateClusterRequest
# ─────────────────────────────────────────────
# Cloudinary helpers
# ─────────────────────────────────────────────
from ..helpers.cloudinary_service import upload_file, delete_file

cv_router = APIRouter(
    prefix="/api/v1/cv",
    tags=["api_v1", "cv"],
)


# ─────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────
@cv_router.post("/upload/{user_id}")
async def upload_cv(
    request: Request,
    user_id: str,
    file: UploadFile,
    job_role: str = Form(...),
    app_settings: Settings = Depends(get_settings)
):
    faiss_service = request.app.state.faiss_service["faiss_service_cv"]
    skills_controller = request.app.state.faiss_service["skills_controller"]
    clustering_controller = request.app.state.faiss_service["clustering_controller"]
    # 1️⃣ Validate file FIRST
    data_controller = DataController()
    is_valid, result_signal = data_controller.validate_uploaded_file(file=file)

    if not is_valid:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": result_signal}
        )

    # 2️⃣ Read file ONCE
    file_bytes = await file.read()
    filename = file.filename
    file_size = len(file_bytes)

    # 3️⃣ Extract text (use ONE method only)
    process_controller = ProcessController()
    cv_text = process_controller.get_file_content_from_upload(
        file_bytes=file_bytes,
        filename=filename
    )
    if not cv_text:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": "TEXT_EXTRACTION_FAILED"}
        )

    # 4️⃣ Upload to Cloudinary
    try:
        upload_result = upload_file(
            file_bytes=file_bytes,
            folder=f"profiles/{user_id}",
            resource_type="raw"
        )

        file_url = upload_result["secure_url"]
        public_id = upload_result["public_id"]

    except Exception as e:
        logger.error(f"Cloud upload error: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": ResponseSignal.FILE_UPLOAD_FAILED.value}
        )

    # 5️⃣ Save CV in DB
    cv_model = await CVModel.create_instance(db_client=request.app.db_client)

    cv_resource = CV(
        cv_user_id=ObjectId(user_id),
        cv_type="FILE",
        cv_name=filename,
        cv_size=file_size,
        cv_text=cv_text,
        cv_config={
            "provider": "cloudinary",
            "url": file_url,
            "public_id": public_id,
            "resource_type": upload_result.get("resource_type"),
            "format": upload_result.get("format")
        }
    )

    cv_record = await cv_model.create_cv(cv=cv_resource)

    # 6️⃣ Store embedding in FAISS (USE SAVED ID)
    cv_emdegging=faiss_service.process_cv(
        mongo_id=str(cv_record.id),
        text=cv_text
    )
    # 7️⃣ Extract skills & cluster
    extracted_skills = []
    embedding_skills = []
    cluster_id = None
    cluster_result = None

    try:
        filtered_result = skills_controller.process_cv(cv_text=cv_text)

        extracted_skills = filtered_result.get("skills", [])
        embedding_skills = filtered_result.get("skills_embeddings", [])

        if extracted_skills and embedding_skills:
            job_embedding = skills_controller.model.embed_job_roles(job_role)[0].tolist()

            cluster_result = cluster_candidate(
                data=CandidateClusterRequest(
                    candidate_id=str(cv_record.id),
                    job_role_embedding=job_embedding,
                    skills_embeddings=embedding_skills
                ),
                clustering_controller=clustering_controller
            )

            cluster_id = cluster_result.cluster_id

    except Exception as e:
        logger.error(f"Clustering error for CV {cv_record.id}: {e}")

    # 8️⃣ Update CV record
    await cv_model.collection.update_one(
        {"_id": ObjectId(cv_record.id)},
        {"$set": {
            "extracted_skills": extracted_skills,
            "cluster_id": cluster_id
        }}
    )

    # 9️⃣ Response
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "signal": ResponseSignal.FILE_UPLOAD_SUCCESS.value,
            "file_id": str(cv_record.id),
            "file_url": file_url,
            "cluster_id": cluster_id,
            "extracted_skills": extracted_skills,
            "cluster_size": len(cluster_result.similar_candidates)
            if cluster_result is not None else 0
        }
    )


@cv_router.delete("/{cv_id}")
async def delete_cv(request: Request, cv_id: str):
    faiss_service = request.app.state.faiss_service["faiss_service_cv"]
    clustering_controller = request.app.state.faiss_service["clustering_controller"]
    cv_model = await CVModel.create_instance(db_client=request.app.db_client)

    cv = await cv_model.collection.find_one({"_id": ObjectId(cv_id)})
    if not cv:
        return JSONResponse(
            status_code=404,
            content={"signal": "CV_NOT_FOUND"}
        )

    # Delete from Cloudinary
    if cv.get("cv_config") and cv["cv_config"].get("public_id"):
        public_id = cv["cv_config"]["public_id"]
        result = delete_file(public_id,resource_type="raw")
        logger.info(f"Cloudinary deletion result: {result}")
    
    # removed_from_cluster
    clustering_controller.remove_candidate(candidate_id=cv_id)
    # Delete from DB
    deleted = await cv_model.delete_cv_by_id(cv_id)
    faiss_service.delete_cv_by_mongo_id(cv_id)
    return {
        "signal": "CV_DELETED_SUCCESSFULLY" if deleted else "CV_NOT_DELETED"
    }
    
# -------------------------------
# Optional: Endpoint to get cluster details
# -------------------------------
@cv_router.get("/cluster/{cluster_id}")
async def get_cluster_details(cluster_id: int, request: Request):
    """Get all candidates in a specific cluster"""

    clustering_controller = request.app.state.faiss_service["clustering_controller"]

    candidates = clustering_controller.get_similar_candidates(cluster_id)

    if not candidates:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "signal": "CLUSTER_NOT_FOUND",
                "cluster_id": cluster_id
            }
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
# New Endpoint: Get all CVs by User
# -------------------------------
@cv_router.get("/user/{user_id}")
async def get_user_cvs(request: Request, user_id: str):
    """Get all CVs uploaded by a specific user"""
    try:
        cv_model = await CVModel.create_instance(db_client=request.app.db_client)
        user_cvs = await cv_model.get_all_user_cvs(cv_user_id=user_id)
        
        cv_list = []
        for cv in user_cvs:
            cv_dict = {
                "id": str(cv.id),
                "cv_name": cv.cv_name,
                "cv_type": cv.cv_type,
                "created_at": cv.cv_pushed_at.isoformat() if cv.cv_pushed_at else None,
                "extracted_skills": getattr(cv, 'extracted_skills', []),
                "cluster_id": getattr(cv, 'cluster_id', None)
            }
            
            # Extract URL if available from cloudinary config
            if hasattr(cv, 'cv_config') and cv.cv_config:
                cv_dict['url'] = cv.cv_config.get('url')
            
            cv_list.append(cv_dict)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "signal": "SUCCESS",
                "cvs": cv_list,
                "count": len(cv_list)
            }
        )
    except Exception as e:
        logger.error(f"Error fetching CVs for user {user_id}: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": "FAILED_TO_FETCH_CVS", "error": str(e)}
        )