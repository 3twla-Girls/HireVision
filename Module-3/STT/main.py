from fastapi import FastAPI
from controllers.stt_controller import router as stt_router

app = FastAPI()

app.include_router(stt_router)
