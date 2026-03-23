from fastapi import FastAPI, UploadFile, File, HTTPException
import shutil
import os
from model_utils import PersonalityPredictor

app = FastAPI(title="HireVision Personality API")

# Initialize predictor (This loads the model into RAM once)
predictor = PersonalityPredictor("weights/personality_r3d_best.pth.zip")

@app.post("/predict-personality")
async def predict_personality(file: UploadFile = File(...)):
    if not file.filename.endswith(('.mp4', '.avi', '.mov','.mkv')):
        raise HTTPException(status_code=400, detail="Invalid video format")

    temp_path = f"uploads/{file.filename}"
    os.makedirs("uploads", exist_ok=True)

    try:
        # 1. Save uploaded file
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 2. Run Inference
        results = predictor.predict(temp_path)
        
        return {"status": "success", "traits": results}

    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        # 3. Cleanup
        if os.path.exists(temp_path):
            os.remove(temp_path)

