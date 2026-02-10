from fastapi import FastAPI
from contextlib import asynccontextmanager
from motor.motor_asyncio import AsyncIOMotorClient

from routes import base, data, JobRoute,skillsRoute
from helpers.config import get_settings
from ranking_system.models_loader import EmbeddingManager
from ranking_system.CONFIG import CONFIG

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup: الحاجات اللي بتحصل أول ما السيرفر يقوم ---
    settings = get_settings()
    
    # 1. ربط الداتابيز
    app.mongo_conn = AsyncIOMotorClient(settings.MONGODB_URL)
    app.db_client = app.mongo_conn[settings.MONGODB_DATABASE]
    print("Connected to MongoDB! ✅")

    # 2. تحميل موديل الـ AI
    print("Loading AI Model (EmbeddingManager)... 🤖")
    app.state.embedder = EmbeddingManager() 
    app.state.config = CONFIG
    print("AI Model Loaded Successfully! ✅")
    
    yield  # السيرفر شغال هنا ومستقبل طلبات
    
    # --- Shutdown: الحاجات اللي بتحصل لما تقفلي السيرفر ---
    app.mongo_conn.close()
    print("MongoDB Connection Closed! 🛑")

# بنمرر الـ lifespan هنا
app = FastAPI(lifespan=lifespan)


app.include_router(base.base_router)
app.include_router(data.data_router)
app.include_router(JobRoute.job_router)
app.include_router(skillsRoute.skills_router)
