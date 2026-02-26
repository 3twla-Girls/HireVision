from fastapi import FastAPI
from Server.routes.questions_with_answers import router as questions_with_answers

app = FastAPI(
    title="HireVision Server",
    version="1.0.0"
)

# Include routes AFTER creating app
app.include_router(questions_with_answers)

@app.get("/")
def root():
    return {"message": "HireVision Server Running"}