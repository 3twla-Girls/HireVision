# ============================================================================
# IMPORTS
# ============================================================================
# Standard Library
import logging
import os

# Third-party Libraries
from contextlib import asynccontextmanager
from Server.routes import cheating_eyeGaze_route
from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient

# Local Imports - Routes
from .routes import base, userRoute, CVRoute, applicationRoute, JobRoute , cheating_eyeGaze_route ,proctoring_router
from .routes.questions_with_answers import router as questions_with_answers
from .routes.interview_routes import interview_router
#from .routes.personality_routes import router as personality_router
from .routes.phone_routes import router as phone_router
# from .routes.report_generator_routes import router as report_generator_route
# Local Imports - Helpers & Config
from .helpers.config import get_settings

# Local Imports - Module_1
from Module_1.src.helpers.app_factory import create_app_services
from Module_1.src.ranking_system.CONFIG import CONFIG

from fastapi.middleware.cors import CORSMiddleware

# ============================================================================
# LOGGER & CONSTANTS
# ============================================================================
logger = logging.getLogger("uvicorn.error")
CLUSTER_FILE = "./Module_1/faiss_store/candidate_clusters.pkl"


# ============================================================================
# LIFESPAN CONTEXT MANAGER
# ============================================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    settings = get_settings()
    
    # --- Startup ---
    # Connect to MongoDB
    app.mongo_conn = AsyncIOMotorClient(settings.MONGODB_URL)
    app.db_client = app.mongo_conn[settings.MONGODB_DATABASE]
    print("Connected to MongoDB! ✅")
    
    # Initialize Module_1 services
    app.state.config = CONFIG
    app.state.faiss_service = create_app_services()
    
    # Load existing clusters if available
    clustering_controller = app.state.faiss_service["clustering_controller"]
    if os.path.exists(CLUSTER_FILE):
        try:
            clustering_controller.load_clusters(CLUSTER_FILE)
            logger.info(f"✅ Loaded existing clusters from {CLUSTER_FILE}")
        except Exception as e:
            logger.warning(
                f"⚠️ Could not load clusters: {e}. Will initialize from JSON."
            )
    
    yield  # Server running and accepting requests
    
    # --- Shutdown ---
    app.mongo_conn.close()
    print("MongoDB Connection Closed! 🛑")


# ============================================================================
# APP INITIALIZATION
# ============================================================================
app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# ============================================================================
# ROUTE REGISTRATION
# ============================================================================
# Module_1 Routes (Base, CV, Jobs, Users, Applications)
app.include_router(base.base_router)
app.include_router(CVRoute.cv_router)
app.include_router(JobRoute.job_router)
app.include_router(userRoute.user_router)
app.include_router(applicationRoute.application_router)
app.include_router(cheating_eyeGaze_route.eyeGazeCheating_router)
app.include_router(proctoring_router.proctringRouter)

# # Module 2 Routes
# app.include_router(personality_router, prefix="/personality", tags=["Personality"])
app.include_router(phone_router)
# app.include_router(report_generator_route)

# Module_3 Routes (Questions, Interviews)
app.include_router(questions_with_answers)
app.include_router(interview_router)