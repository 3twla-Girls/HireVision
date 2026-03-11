from fastapi import FastAPI
from Server.routes.questions_with_answers import router as questions_with_answers
from Server.routes.interview_routes import router as interview_router

app = FastAPI(
    title="HireVision Server",
    version="1.0.0"
)

# Include routes AFTER creating app
app.include_router(questions_with_answers)
app.include_router(interview_router, prefix="/interview", tags=["Interview"])

@app.get("/")
def root():
    return {"message": "HireVision Server Running"}