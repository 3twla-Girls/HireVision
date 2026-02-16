"""
Metrics — Similarity Metric Module.
A standalone FastAPI service that computes semantic similarity between
LLM-generated text and ground-truth reference answers using
sentence-transformer embeddings.
"""

from fastapi import FastAPI
from router import router

app = FastAPI(
    title="HireVision — Similarity Metric",
    description=(
        "Standalone service to compute semantic similarity (cosine similarity "
        "of sentence-transformer embeddings) between LLM-generated outputs "
        "and ground-truth reference answers."
    ),
    version="1.0.0",
)

app.include_router(router, prefix="/similarity")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
