from fastapi import FastAPI
from router import router
import uvicorn

app = FastAPI(
    title="Model Selection Metric Service",
    description="Evaluates multiple LLMs using perplexity to select the best one for question generation.",
    version="1.0.0",
)

app.include_router(router, prefix="/model-selection", tags=["Model Selection"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8006, reload=True)
