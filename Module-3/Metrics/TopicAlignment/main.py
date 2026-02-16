"""
Metrics — Topic Alignment Metric Module.
A standalone FastAPI service that measures how well LLM-generated
interview questions align with the provided job context using
sentence-transformer embeddings + cosine similarity.
"""

from fastapi import FastAPI
from router import router

app = FastAPI(
    title="HireVision — Topic Alignment Metric",
    description=(
        "Standalone service to compute topic alignment scores between "
        "LLM-generated interview questions and the target job context "
        "(job title, skills, experience level) using sentence-transformer "
        "embeddings and cosine similarity."
    ),
    version="1.0.0",
)

app.include_router(router, prefix="/topic-alignment")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
