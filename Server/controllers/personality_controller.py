from fastapi import UploadFile, HTTPException
from Module_2.Personality_Traits_Detection.model_utils import PersonalityPredictor
import shutil, os

predictor = PersonalityPredictor("./Module_2/Personality_Traits_Detection/weights/personality_r3d_best.pth.zip")
async def predict_personality_controller(file: UploadFile):
    if not file.filename.endswith(('.mp4', '.avi', '.mov', '.mkv')):
        raise HTTPException(status_code=400, detail="Invalid video format")

    temp_path = f"uploads/{file.filename}"
    os.makedirs("uploads", exist_ok=True)

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        results = predictor.predict(temp_path)

        return {"status": "success", "traits": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)