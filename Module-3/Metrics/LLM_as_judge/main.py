"""
Metrics — LLM-as-a-Judge System Audit Module.
A standalone FastAPI service that audits the Module-3 pipeline.
"""

from fastapi import FastAPI
from router import router

app = FastAPI(
    title="HireVision — System Audit (LLM-as-a-Judge)",
    description="Standalone service to audit the quality of question generation, reference answers, and answer evaluation.",
    version="1.0.0"
)

app.include_router(router, prefix="/audit")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
