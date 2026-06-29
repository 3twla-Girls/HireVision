import cloudinary
import cloudinary.uploader
import cloudinary.api
from io import BytesIO

from .config import get_settings

# Get credentials from settings
settings = get_settings()

url = settings.CLOUDINARY_URL
url = url.replace("cloudinary://", "")
api_key, rest = url.split(":", 1)
api_secret, cloud_name = rest.split("@", 1)

# Explicitly configure Cloudinary
cloudinary.config(
    cloud_name=cloud_name,
    api_key=api_key,
    api_secret=api_secret
)


def upload_file(file_bytes: bytes, folder: str, resource_type: str):
    """Upload a file to Cloudinary."""
    return cloudinary.uploader.upload(
        BytesIO(file_bytes),
        resource_type=resource_type,
        folder=folder
    )


def delete_file(public_id: str, resource_type: str):
    """Delete a file from Cloudinary."""
    return cloudinary.uploader.destroy(public_id, resource_type=resource_type)


def delete_folder(folder_path: str):

    # 1️⃣ Delete ALL resources inside folder (images, raw, etc.)
    cloudinary.api.delete_resources_by_prefix(
        folder_path,
        resource_type="image"
    )

    cloudinary.api.delete_resources_by_prefix(
        folder_path,
        resource_type="raw"
    )

    # 2️⃣ Delete folder itself
    cloudinary.api.delete_folder(folder_path)

    return {"status": "folder_deleted"}