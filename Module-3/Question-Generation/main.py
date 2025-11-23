from fastapi import FastAPI
from controllers.QuestionGeneration_controller import router as question_router

app = FastAPI()

app.include_router(question_router)
