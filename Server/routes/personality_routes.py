from fastapi import APIRouter, UploadFile, File
from Server.controllers.personality_controller import predict_personality_controller
router = APIRouter()

@router.post("/predict-personality")
async def predict_personality(file: UploadFile = File(...)):
    return await predict_personality_controller(file)