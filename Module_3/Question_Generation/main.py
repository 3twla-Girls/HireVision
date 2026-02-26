from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from  Module_3.Question_Generation.routes.routes import router as question_router
import time

app = FastAPI(
    title="Interview Question Generator API",
    description="API for generating technical interview questions and answers",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ⏱️ Timing Middleware - Add this AFTER CORS
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.2f}s"
    return response

# Include routers
app.include_router(question_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)