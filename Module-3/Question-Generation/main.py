from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from controllers.routes import router as question_router

app = FastAPI(
    title="Interview Question Generator API",
    description="API for generating technical interview questions and answers",
    version="1.0.0"
)

# CORS middleware (optional - if you have a frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(question_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)