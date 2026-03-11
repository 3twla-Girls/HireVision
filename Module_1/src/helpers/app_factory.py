from Server.helpers.config import get_settings
from ..helpers.faiss_service import FAISSService

from ..controllers.SkillsExtractionController import SkillsController
from ..controllers.CandidateClusteringController import CandidateClusteringController


def create_app_services():

    settings = get_settings()

    faiss_service_cv = FAISSService(
        dimension=1024,
        index_path="./Module_1/faiss_store/cv_embeddings.index",
        mapping_path="./Module_1/faiss_store/cv_id_mapping.pkl",
        embedding_store_path="./Module_1/faiss_store/cv_embedding_store.pkl"
    )
    
    faiss_service_job= FAISSService(
        dimension=1024,
        index_path="./Module_1/faiss_store/job_embeddings.index",
        mapping_path="./Module_1/faiss_store/job_id_mapping.pkl",
        embedding_store_path="./Module_1/faiss_store/job_description_embeddings.pkl"
    )
    
    skills_controller = SkillsController(
        embedding_model_name=settings.EMBED_MODEL,
        verbose=True
    )

    clustering_controller = CandidateClusteringController(
        embedding_dim=1024,
        threshold=0.94
    )

    return {
        "settings": settings,
        "faiss_service_cv": faiss_service_cv,
        "faiss_service_job": faiss_service_job,
        "skills_controller": skills_controller,
        "clustering_controller": clustering_controller
    }
