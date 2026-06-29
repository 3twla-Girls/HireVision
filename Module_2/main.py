from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from headPose_eyeGaze.cheating_router import router as cheating_router

app = FastAPI()


# Allow requests from your React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
 
# Register the cheating detection routes
app.include_router(cheating_router, prefix="/api")
 