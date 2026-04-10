from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
import logging
from bson import ObjectId
from fastapi import BackgroundTasks
from ..helpers.hiring_automating_service import run_hiring_automation
from ..helpers.config import get_settings, Settings
from ..controllers.JobController import JobController
from ..models.db_schemes.JobScheme import JobScheme
from Module_1.src.routes.skillsRoute import cluster_candidate, CandidateClusterRequest
logger = logging.getLogger('uvicorn.error')

job_router = APIRouter(
    prefix="/api/v1/job",
    tags=["api_v1", "job"],
)
from Module_1.src.helpers.job_skills import JobSkillsStore

skills_embedder = JobSkillsStore()
# =============================
# create Job under a Project
# =============================
@job_router.post("/create/{recruiter_id}")
async def create_job(request: Request, recruiter_id: str, job: JobScheme,
                    app_settings: Settings = Depends(get_settings)):
    
    faiss_service_job=request.app.state.faiss_service["faiss_service_job"]
    skills_controller = request.app.state.faiss_service["skills_controller"]
    clustering_controller = request.app.state.faiss_service["clustering_controller"]
    job_controller = await JobController.create_instance(
        db_client=request.app.db_client,
        faiss_service_job=faiss_service_job
    )

    try:
        # 1️⃣ Create job
        job_record = await job_controller.create_job(
            recruiter_id=recruiter_id,
            job_data=job
        )

        job_id = str(job_record.inserted_id)
        # 2️⃣ Store job description embedding (FAISS)
        faiss_service_job.process_cv(
            mongo_id=job_id,
            text=job.job_description
        )
        #embed job skills
        try:
            skills_embedder.process_job_skills(job_id, job.required_skills)
        except Exception as e:
            logger.warning(f"Non-critical: Failed to process individual skills: {e}")
        
        cluster_id = None
        
        try:
            filtered_result = skills_controller.process_cv(cv_text=job.job_description)

            # Ensure filtered_result is a dict
            if filtered_result is None or not isinstance(filtered_result, dict):
                logger.warning(f"process_cv returned invalid type: {type(filtered_result)}")
                filtered_result = {"skills": [], "skills_embeddings": []}

            extracted_skills = filtered_result.get("skills", [])
            embedding_skills = filtered_result.get("skills_embeddings", [])
            
            # Validate that embedding_skills is a list
            if not isinstance(embedding_skills, list):
                logger.warning(f"embedding_skills is {type(embedding_skills)}, expected list")
                embedding_skills = []

            if extracted_skills and embedding_skills:
                job_embedding = skills_controller.model.embed_job_roles(job.job_title)[0].tolist()
                
                # Ensure embedding_skills contains lists, not numpy arrays
                embedding_skills_lists = []
                for emb in embedding_skills:
                    if hasattr(emb, 'tolist'):  # Check if it's a numpy array
                        embedding_skills_lists.append(emb.tolist())
                    else:
                        embedding_skills_lists.append(emb)
                
                cluster_result = cluster_candidate(
                        data=CandidateClusterRequest(
                            candidate_id=str(job_id),
                            job_role_embedding=job_embedding,
                            skills_embeddings=embedding_skills_lists
                        ),
                        clustering_controller=clustering_controller
                )
                cluster_id = cluster_result.cluster_id
        
        except Exception as e:
            logger.error(f"Error in clustering: {e}")
            import traceback
            traceback.print_exc()
            cluster_id = None

        # 6️⃣ Save cluster_id in DB
        await job_controller.job_model.update_job(
            job_record.inserted_id,
            {"cluster_id": cluster_id}
        )

        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={
                "signal": "JOB_CREATED_SUCCESSFULLY",
                "job_id": job_id,
                "cluster_id": cluster_id
            }
        )

    except Exception as e:
        logger.error(f"Error creating job: {e}")
        signal = "JOB_ALREADY_EXISTS" if str(e) == "JOB_ALREADY_EXISTS" else "JOB_CREATION_FAILED"
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": signal}
        )
        
# =============================
# Get all jobs
# =============================
@job_router.get("/all_jobs")
async def get_all_jobs(request: Request):
    faiss_service_job=request.app.state.faiss_service["faiss_service_job"]
    job_controller = await JobController.create_instance(
        db_client=request.app.db_client,
        faiss_service_job=faiss_service_job
    )
    try:
        jobs = await job_controller.get_all_jobs()
        return jobs
    except Exception as e:
        logger.error(f"Error fetching all jobs: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": "ALL_JOBS_FETCH_FAILED"}
        )
        
        
# =============================
# Get jobs by cluster_id
# =============================
@job_router.get("/cluster/{cluster_id}")
async def get_jobs_by_cluster(request: Request, cluster_id: int):
    faiss_service_job=request.app.state.faiss_service["faiss_service_job"]
    job_controller = await JobController.create_instance(
        db_client=request.app.db_client,
        faiss_service_job=faiss_service_job
    )
    try:
        jobs = await job_controller.get_jobs_by_cluster(cluster_id=cluster_id)
        return jobs
    except Exception as e:
        logger.error(f"Error fetching jobs by cluster: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": "CLUSTER_JOBS_FETCH_FAILED"}
        )

# =============================
# get all Jobs by Recruiter ID
# =============================
@job_router.get("/all/{recruiter_id}")
async def get_jobs(request: Request, recruiter_id: str):
    from ..controllers.ApplicationController import ApplicationController
    from bson import ObjectId
    faiss_service_job=request.app.state.faiss_service["faiss_service_job"]
    job_controller = await JobController.create_instance(
        db_client=request.app.db_client,
        faiss_service_job=faiss_service_job
    )
    app_controller = await ApplicationController.create_instance(request.app.db_client)

    try:
        jobs = await job_controller.get_jobs_by_recruiter(recruiter_id=recruiter_id)
        
        # Populate applicants_count dynamically
        for job in jobs:
            count = await app_controller.collection.count_documents({"job_id": ObjectId(job.id)})
            job.applicants_count = count

        return jobs

    except Exception as e:
        logger.error(f"Error fetching jobs: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": "JOB_FETCH_FAILED"}
        )

# =============================
# Get recommended jobs for a user
# =============================
@job_router.get("/recommended/{user_id}")
async def get_recommended_jobs(request: Request, user_id: str):
    import traceback
    from bson import ObjectId as BsonObjectId
    from fastapi.encoders import jsonable_encoder

    faiss_service_job = request.app.state.faiss_service["faiss_service_job"]
    job_controller = await JobController.create_instance(
        db_client=request.app.db_client,
        faiss_service_job=faiss_service_job
    )
    try:
        jobs = await job_controller.get_recommended_jobs(user_id=user_id)
        serialized = jsonable_encoder(
            jobs,
            custom_encoder={BsonObjectId: str}
        )
        return JSONResponse(status_code=status.HTTP_200_OK, content=serialized)
    except Exception as e:
        logger.error(
            f"Error fetching recommended jobs for user {user_id}: {e}\n"
            f"{traceback.format_exc()}"
        )
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": "RECOMMENDED_JOBS_FETCH_FAILED"}
        )

# =============================
# get Job by ID
# =============================
@job_router.get("/{job_id}")
async def get_job(request: Request, job_id: str):
    from ..controllers.ApplicationController import ApplicationController
    from bson import ObjectId
    faiss_service_job=request.app.state.faiss_service["faiss_service_job"]
    job_controller = await JobController.create_instance(
        db_client=request.app.db_client,
        faiss_service_job=faiss_service_job
    )

    try:
        job = await job_controller.get_job(job_id=job_id)
        
        # Populate applicants_count dynamically
        app_controller = await ApplicationController.create_instance(request.app.db_client)
        count = await app_controller.collection.count_documents({"job_id": ObjectId(job.id)})
        job.applicants_count = count
        
        return job

    except Exception as e:
        logger.error(f"Error fetching job: {e}")
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"signal": "JOB_NOT_FOUND"}
        )

# =============================
# Update Job Status only
# =============================
@job_router.patch("/{job_id}/status")
async def update_job_status(request: Request, job_id: str, background_tasks: BackgroundTasks):
    """
    Updates the job status and triggers the hiring automation pipeline
    when a job transitions to 'closed' or 'expired'.

    The pipeline (run_hiring_automation) will:
      1. Rank all applicants
      2. Select the top N candidates  (status → accepted_for_interview)
      3. AUTO-SEND interview invitation emails to every accepted candidate
    """
    faiss_service_job = request.app.state.faiss_service.get("faiss_service_job")

    job_controller = await JobController.create_instance(
        db_client=request.app.db_client,
        faiss_service_job=faiss_service_job
    )

    try:
        body = await request.json()
        new_status = body.get("status")

        if new_status not in ["open", "closed", "expired"]:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"signal": "INVALID_STATUS"}
            )

        current_job = await job_controller.job_model.find_by_id(ObjectId(job_id))

        if not current_job:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"signal": "JOB_NOT_FOUND"}
            )

        old_status = current_job.get("status")

        await job_controller.job_model.update_job(
            ObjectId(job_id),
            {"status": new_status}
        )

        # Trigger automation when job closes (manual close OR forced expiry).
        # The pipeline will rank candidates and then auto-email invitations.
        closing_statuses = {"closed", "expired"}
        if new_status in closing_statuses and old_status == "open":
            logger.info(f"Triggering hiring pipeline for job: {job_id} (status: {new_status})")
            background_tasks.add_task(run_hiring_automation, current_job, request.app)

        return JSONResponse(
            content={
                "signal": "JOB_STATUS_UPDATED",
                "status": new_status
            }
        )

    except Exception as e:
        print(f"DEBUG ERROR in update_job_status: {e}")
        logger.error(f"Error updating job status: {e}", exc_info=True)

        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "signal": "JOB_STATUS_UPDATE_FAILED",
                "error": str(e)
            }
        )

# =============================
# Update Job
# =============================
@job_router.patch("/{job_id}")
async def update_job(request: Request, job_id: str, job: JobScheme):
    faiss_service_job=request.app.state.faiss_service["faiss_service_job"]
    job_controller = await JobController.create_instance(
        db_client=request.app.db_client,
        faiss_service_job=faiss_service_job
    )

    try:
        updated_job = await job_controller.update_job(
            job_id=job_id,
            job_data=job
        )
        return updated_job

    except Exception as e:
        logger.error(f"Error updating job: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": "JOB_UPDATE_FAILED"}
        )

# =============================
# Delete Job
# =============================
@job_router.delete("/{job_id}")
async def delete_job(request: Request, job_id: str):
    faiss_service_job=request.app.state.faiss_service["faiss_service_job"]
    clustering_controller = request.app.state.faiss_service["clustering_controller"]
    job_controller = await JobController.create_instance(
        db_client=request.app.db_client,
        faiss_service_job=faiss_service_job,
        skills_embedder=skills_embedder
    )

    try:
        await job_controller.delete_job(job_id=job_id)
        faiss_service_job.delete_cv_by_mongo_id(job_id)
        # removed_from_cluster
        clustering_controller.remove_candidate(candidate_id=job_id)
        return JSONResponse(content={"signal": "JOB_DELETED_SUCCESSFULLY"})

    except Exception as e:
        logger.error(f"Error deleting job: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": "JOB_DELETE_FAILED"}
        )


# Get job's rankings
@job_router.get("/{job_id}/rankings")
async def get_job_rankings(request: Request, job_id: str):
    job_controller = await JobController.create_instance(request.app.db_client, faiss_service_job=request.app.state.faiss_service["faiss_service_job"])
    try:
        
        # Get rankings with embedder and config
        rankings = await job_controller.get_rankings(job_id=job_id,config=request.app.state.config,faiss_service_cv=request.app.state.faiss_service["faiss_service_cv"],faiss_service_job=request.app.state.faiss_service["faiss_service_job"])
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"rankings": rankings}
        )
    except Exception as e:
        logger.error(f"Error fetching rankings for job {job_id}: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": str(e)}
        )


# =============================
# Get shortlisted session IDs
# =============================
@job_router.get("/{job_id}/shortlisted-sessions")
async def get_shortlisted_sessions(request: Request, job_id: str):
    """
    Returns the list of interview session IDs whose status is
    'accepted_for_interview' for the given job.

    Used by the frontend BulkInviteModal to pre-populate session IDs
    so the recruiter can re-send or customise invitations after the
    pipeline has already run automatically.

    Response:
        {
            "job_id": "<job_id>",
            "session_ids": ["<id1>", "<id2>", ...],
            "count": 2
        }
    """
    from ..models.enums.DataBaseEnum import DataBaseEnum

    try:
        collection = request.app.db_client[
            DataBaseEnum.COLLECTION_APPLICATION_NAME.value
        ]

        cursor = collection.find(
            {
                "job_id": ObjectId(job_id),
                "status": "accepted_for_interview",
            },
            {"_id": 1}
        )
        docs = await cursor.to_list(length=None)
        session_ids = [str(doc["_id"]) for doc in docs]

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "job_id":      job_id,
                "session_ids": session_ids,
                "count":       len(session_ids),
            }
        )

    except Exception as e:
        logger.error(f"Error fetching shortlisted sessions for job {job_id}: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": "SHORTLISTED_SESSIONS_FETCH_FAILED", "error": str(e)}
        )


# =============================
# Trigger Hiring Pipeline (Admin)
# =============================
@job_router.post("/{job_id}/trigger-pipeline")
async def trigger_pipeline(
    request: Request,
    job_id: str,
    background_tasks: BackgroundTasks,
    force: bool = False,
):
    """
    Manually trigger the hiring automation pipeline for a given job.

    - **force**: if True, bypasses the idempotency guard so the pipeline
      re-runs even if candidates have already been accepted.

    The pipeline runs in the background and returns immediately.
    To run synchronously (blocking, for debugging), set `sync=true`.
    """
    faiss_service_job = request.app.state.faiss_service.get("faiss_service_job")
    job_controller = await JobController.create_instance(
        db_client=request.app.db_client,
        faiss_service_job=faiss_service_job
    )

    try:
        job_doc = await job_controller.job_model.find_by_id(ObjectId(job_id))
        if not job_doc:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"signal": "JOB_NOT_FOUND"}
            )

        # Check if caller wants synchronous execution (for testing/admin)
        body = {}
        try:
            body = await request.json()
        except Exception:
            pass
        run_sync = body.get("sync", False)

        if run_sync:
            # Blocking — returns the full pipeline result
            result = await run_hiring_automation(job_doc, request.app, force=force)
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={"signal": "PIPELINE_COMPLETE", "result": result}
            )
        else:
            # Non-blocking — fires and returns immediately
            background_tasks.add_task(run_hiring_automation, job_doc, request.app, force)
            return JSONResponse(
                status_code=status.HTTP_202_ACCEPTED,
                content={
                    "signal": "PIPELINE_TRIGGERED",
                    "job_id": job_id,
                    "force": force,
                    "mode": "background"
                }
            )

    except Exception as e:
        logger.error(f"Error triggering pipeline for job {job_id}: {e}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"signal": "PIPELINE_TRIGGER_FAILED", "error": str(e)}
        )


# =============================
# Get Pipeline Result for a Job
# (reads accepted applications as a proxy for pipeline state)
# =============================
@job_router.get("/{job_id}/pipeline-status")
async def get_pipeline_status(request: Request, job_id: str):
    """
    Returns a summary of the pipeline's effect on a job:
    - How many applications are accepted_for_interview
    - How many are rejected
    - How many are still pending
    """
    from ..controllers.ApplicationController import ApplicationController
    from ..models.enums.ApplicationEnum import ApplicationStatusEnum

    try:
        db = request.app.db_client
        app_ctrl = await ApplicationController.create_instance(db)

        from bson import ObjectId as BsonId
        pipeline = [
            {"$match": {"job_id": BsonId(job_id)}},
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        collection = app_ctrl.collection
        cursor = collection.aggregate(pipeline)
        docs = await cursor.to_list(length=None)

        counts = {doc["_id"]: doc["count"] for doc in docs}
        total = sum(counts.values())

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "job_id": job_id,
                "total_applications": total,
                "breakdown": counts,
                "pipeline_ran": ApplicationStatusEnum.ACCEPTED_FOR_INTERVIEW.value in counts
            }
        )
    except Exception as e:
        logger.error(f"Error fetching pipeline status for job {job_id}: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": "PIPELINE_STATUS_FETCH_FAILED", "error": str(e)}
        )
