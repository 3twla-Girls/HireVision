# main.py

from fastapi import FastAPI
import uvicorn
from api.routers.interview_router import router as interview_router # Import the unified router

# --- FastAPI App Initialization ---
app = FastAPI(
    title="Unified Mock Interview Pipeline API",
    description="Single-file structure hosting Question Generation, STT, and Evaluation.",
    version="1.0.0"
)

# --- Router Registration ---
# Register the unified router
app.include_router(interview_router)

# --- Uvicorn Execution ---
if __name__ == "__main__":
    # Ensure this is run from the project root or adjust the path accordingly.
    # The 'interview_router' object must be imported correctly for this to work.
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)