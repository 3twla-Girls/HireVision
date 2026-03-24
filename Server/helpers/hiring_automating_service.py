import logging
from bson import ObjectId
from datetime import datetime, timedelta
from ..controllers.ApplicationController import ApplicationController
from ..controllers.JobController import JobController

logger = logging.getLogger(__name__)

async def run_hiring_automation(job_data: dict, app):
    """
    Orchestrates the ranking and notification process once a job is closed.
    """
    job_id = str(job_data.get("_id"))
    
    # Retrieve recruiter settings or use defaults
    top_limit = job_data.get("top_candidates_count", 15)
    gap_days = job_data.get("interview_gap_days", 5)
    
    try:
        logger.info(f"🚀 [Automation] Starting pipeline for Job ID: {job_id}")

        # 1️⃣ Initialize JobController with required FAISS services
        job_controller = await JobController.create_instance(
            db_client=app.db_client, 
            faiss_service_job=app.state.faiss_service["faiss_service_job"]
        )


        # 2️⃣ Execute the heavy ranking logic
        # This includes AI feedback generation and Cloudinary uploads
        logger.info(f"before rankinig ")
        rankings = await job_controller.get_rankings(
            job_id=job_id,
            config=app.state.config,
            faiss_service_cv=app.state.faiss_service["faiss_service_cv"],
            faiss_service_job=app.state.faiss_service["faiss_service_job"]
        )
        
        logger.info(f"done rankinig {rankings}")

        if not rankings:
            logger.warning(f"⚠️ [Automation] No candidates to rank for job {job_id}")
            return
        
        logger.info(f"Here is the ranking list {rankings}")

        # 3️⃣ Select top-tier candidates based on the limit
        shortlisted = rankings[:top_limit]

        # 4️⃣ Schedule the automated interview date
        interview_date = datetime.now() + timedelta(days=gap_days)
        formatted_date = interview_date.strftime("%Y-%m-%d %I:%M %p")

        # 5️⃣ Process notifications and database updates
        app_controller = await ApplicationController.create_instance(app.db_client)

        for rank_entry in shortlisted:
            cv_id = rank_entry.get("cv_id")
            
            # Fetch candidate details from CV collection to get the email
            cv_record = await app.db_client.db.cvs.find_one({"_id": ObjectId(cv_id)})
            if not cv_record:
                continue

            candidate_email = cv_record.get("email") # Ensure your CV schema has 'email'
            candidate_name = cv_record.get("name")

            if candidate_email:
                # Dispatch the invitation email
                await send_interview_invitation(
                    email=candidate_email,
                    name=candidate_name,
                    job_title=job_data.get("job_title"),
                    date=formatted_date
                )
                
                # Update application status to 'shortlisted' in MongoDB
                await app.db_client.db.applications.update_one(
                    {"job_id": ObjectId(job_id), "candidate_cv_id": str(cv_id)},
                    {"$set": {"status": "shortlisted"}}
                )

        logger.info(f"✅ [Automation] Workflow complete. {len(shortlisted)} candidates notified.")

    except Exception as e:
        logger.error(f"❌ [Automation] Pipeline failed: {e}", exc_info=True)

async def send_interview_invitation(email, name, job_title, date):
    """
    Mock service for email dispatch. Replace with SMTP logic later.
    """
    logger.info(f"📧 [EMAIL SENT] To: {email} | Target Job: {job_title} | Scheduled: {date}")