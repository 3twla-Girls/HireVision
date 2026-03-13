from fastapi import FastAPI
from routes.personality_route import router

app = FastAPI()

app.include_router(router)