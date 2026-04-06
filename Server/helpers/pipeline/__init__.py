# Hiring Automation Pipeline
# Each step is isolated in its own module for easy extension.
from .orchestrator import run_pipeline

__all__ = ["run_pipeline"]
