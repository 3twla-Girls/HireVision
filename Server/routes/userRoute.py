from fastapi import APIRouter, Request, status, UploadFile, File, Form
from fastapi.responses import JSONResponse
import logging
from bson import ObjectId
from bson.errors import InvalidId

from ..controllers import UserController, ApplicationController, JobController
from ..models.db_schemes.user import CreateUserScheme
from ..helpers.cloudinary_service import upload_file, delete_folder
from ..models.CVModel import CVModel
logger = logging.getLogger("uvicorn.error")

user_router = APIRouter(
    prefix="/api/v1/user",
    tags=["api_v1", "user"],
)

# =============================
# Create User
# =============================
@user_router.post("/create")
async def create_user(
    request: Request,
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role: str = Form(...),
    education: str = Form(None),
    date_of_birth: str = Form(None),
    job_title: str = Form(None),
    location: str = Form(None),
    company_name: str = Form(None),
    company_web_link: str = Form(None),
    image: UploadFile = File(...)
):
    controller = await UserController.create_instance(request.app.db_client)

    try:
        file_bytes = await image.read()

        user_dict = {
            "name": name,
            "email": email,
            "password": password,
            "role": role,
            "education": education,
            "job_title": job_title,
            "location": location,
            "company_name": company_name,
            "company_web_link": company_web_link,
            "date_of_birth": date_of_birth
        }

        user_dict = {k: v for k, v in user_dict.items() if v is not None}
        user_data = CreateUserScheme(**user_dict)

        result = await controller.create_user(user_data)
        user_id = str(result.inserted_id)

        # Upload profile image
        upload_result = upload_file(
            file_bytes=file_bytes,
            folder=f"images/{user_id}",
            resource_type="image"
        )

        await controller.update_user(
            user_id,
            {
                "profile_image_url": upload_result["secure_url"],
                "profile_image_public_id": upload_result["public_id"]
            }
        )

        return {
            "signal": "USER_CREATED_SUCCESSFULLY",
            "user_id": user_id,
            "image_url": upload_result["secure_url"]
        }

    except Exception as e:
        logger.error(f"Error creating user: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": str(e)}
        )

# =============================
# Login (MUST stay above /{user_id})
# =============================
@user_router.get("/login")
async def login(request: Request, email: str, password: str):
    controller = await UserController.create_instance(request.app.db_client)
    try:
        logger.info(f"[LOGIN] email={email!r}  password={password!r}")
        user = await controller.get_user_email_password(email, password)
        return JSONResponse(content={"user": user})
    except Exception as e:
        logger.warning(f"[LOGIN] failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"signal": str(e)}
        )

# =============================
# Get User
# =============================
@user_router.get("/{user_id}")
async def get_user(request: Request, user_id: str):
    controller = await UserController.create_instance(request.app.db_client)

    try:
        user = await controller.get_user(user_id)
        return JSONResponse(content={"user": user})

    except InvalidId:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": "INVALID_USER_ID"}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"signal": str(e)}
        )
# =============================
# Get User by email and password
# =============================
@user_router.get("/{email}/{password}")
async def login(request: Request, email: str, password: str):
    controller = await UserController.create_instance(request.app.db_client)

    try:
        user = await controller.get_user_email_password(email, password)
        return JSONResponse(content={"user": user})

    except InvalidId:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": "INVALID_USER_ID"}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"signal": str(e)}
        )

# =============================
# Update User
# =============================
@user_router.patch("/{user_id}")
async def update_user(request: Request, user_id: str, update_data: dict):
    controller = await UserController.create_instance(request.app.db_client)

    try:
        updated_user = await controller.update_user(user_id, update_data)
        return JSONResponse(content={"user": updated_user})

    except Exception:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": "USER_UPDATE_FAILED"}
        )

# =============================
# Delete User
# =============================
@user_router.delete("/{user_id}")
async def delete_user(request: Request, user_id: str):
    controller = await UserController.create_instance(request.app.db_client)
    clustering_controller = request.app.state.faiss_service["clustering_controller"]
    try:
        user = await controller.get_user(user_id)
        role = user["role"]

        # =============================
        # JOBSEEKER
        # =============================
        if role == "jobseeker":
            # Delete Cloudinary folders
            for folder in [f"images/{user_id}", f"profiles/{user_id}",f"feedbacks/{user_id}"]:
                try:
                    delete_folder(folder)
                    logger.info(f"Cloudinary folder deleted: {folder}")
                except Exception as e:
                    logger.warning(f"Failed to delete folder {folder}: {e}")

            # Delete CVs from FAISS + MongoDB
            cv_model = await CVModel.create_instance(db_client=request.app.db_client)
            all_cvs = await cv_model.get_all_user_cvs(cv_user_id=user_id)
            mongo_ids = [str(cv.id) for cv in all_cvs]

            if mongo_ids:
                embedding_obj = request.app.state.faiss_service["faiss_service_cv"]
                embedding_obj.delete_cvs_by_mongo_ids(mongo_ids)

            await cv_model.delete_all_user_cvs(cv_user_id=user_id)
            #delete from clustering
            clustering_controller.remove_candidates(candidate_ids=mongo_ids)
            # Delete applications submitted by user
            application_controller = await ApplicationController.create_instance(request.app.db_client)
            deleted_applications_count = await application_controller.delete_applications_by_user_id(user_id)
            logger.info(f"Deleted {deleted_applications_count} applications for jobseeker {user_id}")

        # =============================
        # RECRUITER
        # =============================
        elif role == "recruiter":
            # Delete ONLY images folder
            try:
                delete_folder(f"images/{user_id}")
                delete_folder(f"feedbacks/{user_id}")
                logger.info(f"Cloudinary images & feedbacks folder deleted for recruiter {user_id}")
            except Exception as e:
                logger.warning(f"Failed to delete images & feedbacks folder: {e}")

            # Delete recruiter jobs from FAISS + MongoDB
            embedding_obj = request.app.state.faiss_service["faiss_service_job"]
            job_controller = await JobController.create_instance(
            db_client=request.app.db_client
            )
            all_jobs = await job_controller.get_jobs_by_recruiter(recruiter_id=user_id)
            mongo_ids = [str(job.id) for job in all_jobs]  # id mapped in get_jobs_by_recruiter
            embedding_obj.delete_cvs_by_mongo_ids(mongo_ids)
            #delete from clustering
            clustering_controller.remove_candidates(candidate_ids=mongo_ids)
            # Delete applications related to recruiter jobs
            application_controller = await ApplicationController.create_instance(request.app.db_client)
            await application_controller.delete_applications_by_recruiter_jobs(user_id)
            
            deleted_jobs_count = await job_controller.delete_jobs_by_recruiter(user_id)
            logger.info(f"Deleted {deleted_jobs_count} jobs for recruiter {user_id}")


        # =============================
        # Finally delete user
        # =============================
        await controller.delete_user(user_id)
        return JSONResponse(content={"signal": "USER_DELETED_SUCCESSFULLY"})

    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": "USER_DELETE_FAILED"}
        )