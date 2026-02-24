from DB.config.database import jobs_collection
from bson import ObjectId


def get_job_by_id(job_id: str):
    return jobs_collection.find_one({"_id": ObjectId(job_id)})


def create_job(job_role: str, experience_level: str, req_skills: list):
    result = jobs_collection.insert_one({
        "job_role": job_role,
        "experience_level": experience_level,
        "req_skills": req_skills
    })
    return str(result.inserted_id)
