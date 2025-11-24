from fastapi import FastAPI
from controllers.routes import router as question_router

app = FastAPI()

app.include_router(question_router)
