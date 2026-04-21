from fastapi import APIRouter, Request, status, UploadFile, File, Form, Depends, Header
from fastapi.responses import JSONResponse
import logging

from ..controllers import UserController
from ..models.db_schemes.user import CreateUserScheme
from ..helpers.cloudinary_service import upload_file

logger = logging.getLogger("uvicorn.error")

user_router = APIRouter(
    prefix="/api/v1/user",
    tags=["api_v1", "user"],
)

# =============================
# Auth Dependency
# =============================
async def get_current_user(
    request: Request,
    authorization: str = Header(...)
):
    try:
        token = authorization.split(" ")[1]  # Bearer <token>

        controller = await UserController.create_instance(request.app.db_client)
        user = await controller.get_current_user(token)

        return user

    except Exception:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"signal": "UNAUTHORIZED"}
        )

# =============================
# Create User (Signup)
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

        user_id = result["user_id"]
        token = result["access_token"]

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
            "access_token": token,
            "image_url": upload_result["secure_url"]
        }

    except Exception as e:
        logger.error(f"Error creating user: {e}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": str(e)}
        )

# =============================
# 🔐 Login (POST ONLY)
# =============================
"""@user_router.post("/login")
async def login(
    request: Request,
    email: str = Form(...),
    password: str = Form(...)
):
    controller = await UserController.create_instance(request.app.db_client)

    try:
        result = await controller.login(email, password)

        return JSONResponse(content=result)

    except Exception as e:
        logger.warning(f"[LOGIN FAILED] email={email}")
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"signal": str(e)}
        )"""
from pydantic import BaseModel

class LoginSchema(BaseModel):
    email: str
    password: str
@user_router.post("/login")
async def login(request: Request, data: LoginSchema):
    controller = await UserController.create_instance(request.app.db_client)

    result = await controller.login(data.email, data.password)
    return result
# =============================
# 🔐 Get Current User
# =============================
@user_router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    return JSONResponse(content={"user": current_user})

# =============================
# 🔐 Get User by ID (Protected)
# =============================
"""@user_router.get("/{user_id}")
async def get_user(
    request: Request,
    user_id: str,
    current_user=Depends(get_current_user)
):
    controller = await UserController.create_instance(request.app.db_client)

    try:
        user = await controller.get_user(user_id)
        return JSONResponse(content={"user": user})

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"signal": str(e)}
        )"""
from bson.errors import InvalidId
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
# 🔐 Update User (Protected)
# =============================
@user_router.patch("/{user_id}")
async def update_user(
    request: Request,
    user_id: str,
    update_data: dict,
    current_user=Depends(get_current_user)
):
    controller = await UserController.create_instance(request.app.db_client)

    try:
        # Optional: only allow user to update himself
        if current_user["_id"] != user_id:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"signal": "FORBIDDEN"}
            )

        updated_user = await controller.update_user(user_id, update_data)

        return JSONResponse(content={"user": updated_user})

    except Exception:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"signal": "USER_UPDATE_FAILED"}
        )

# =============================
# 🔐 Delete User (Protected)
# =============================
@user_router.delete("/{user_id}")
async def delete_user(
    request: Request,
    user_id: str,
    current_user=Depends(get_current_user)
):
    controller = await UserController.create_instance(request.app.db_client)

    try:
        # Only allow self delete (or extend later for admin)
        if current_user["_id"] != user_id:
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"signal": "FORBIDDEN"}
            )

        await controller.delete_user(user_id)

        return JSONResponse(content={"signal": "USER_DELETED"})

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"signal": str(e)}
        )