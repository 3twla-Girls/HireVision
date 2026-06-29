from fastapi import FastAPI
from router import router

app = FastAPI(
    title="HireVision - Answer Evaluation Module",
    description="API for evaluating interview answers and generating final summaries.",
    version="1.0.0"
)

# Include endpoints from router.py
app.include_router(router, prefix="/api")


