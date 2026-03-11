import logging
from typing import List, Dict, Any, TYPE_CHECKING
import numpy as np

from .utils import mask_pii, normalize_skills
from .skill_scoring import SkillImportanceScorer
from .matcher import HybridSkillMatcher
from .ranker import FusionEngine

if TYPE_CHECKING:
    from Server.models.db_schemes.CV import CV
    from Server.models.db_schemes.JobScheme import JobScheme
else:
    CV = Any
    JobScheme = Any


logger = logging.getLogger("uvicorn.error")


def rank_cvs_for_job(
    job: JobScheme,
    cv_list: List[CV],
    config: Dict,
    faiss_service_cv,
    faiss_service_job
) -> List:

    all_candidates_results = []

    try:

        job_skills = job.required_skills
        MAX_CVS = config.get("max_cvs_rank", 200)

        if len(cv_list) > MAX_CVS:
            logger.warning(
                f"Truncating CV list {len(cv_list)} -> {MAX_CVS}"
            )
            cv_list = cv_list[:MAX_CVS]


        # ---------------------------------------------------
        # Get Job Embedding
        # ---------------------------------------------------

        job_embedding = faiss_service_job.get_embedding_by_mongo_id(str(job.id))

        if not job_embedding:
            logger.error(f"Job embedding not found for job {job.id}")
            return []

        job_vec = np.array(job_embedding["embedding"], dtype="float32").flatten()

        # ---------------------------------------------------
        # Initialize Ranking Components
        # ---------------------------------------------------

        matcher = HybridSkillMatcher(config=config)
        skill_scorer = SkillImportanceScorer()
        fusion_engine = FusionEngine()

        # ---------------------------------------------------
        # Process each CV
        # ---------------------------------------------------

        for cv_raw in cv_list:

            try:

                cv_text = normalize_skills(mask_pii(cv_raw.cv_text))

                # -----------------------------------------
                # Get CV embedding
                # -----------------------------------------

                cv_emb = faiss_service_cv.get_embedding_by_mongo_id(str(cv_raw.id))

                if not cv_emb:
                    logger.warning(f"Missing embedding for CV {cv_raw.id}")
                    continue

                cv_vec = np.array(cv_emb["embedding"], dtype="float32").flatten()

                # -----------------------------------------
                # Ensure dimensions match
                # -----------------------------------------

                if cv_vec.shape != job_vec.shape:
                    logger.warning(
                        f"Embedding size mismatch CV {cv_raw.id} "
                        f"{cv_vec.shape} vs job {job_vec.shape}"
                    )
                    continue

                # -----------------------------------------
                # Dense Similarity (cosine)
                # -----------------------------------------

                try:
                    dense_score_raw = np.dot(cv_vec, job_vec)

                    dense_score = float(dense_score_raw)

                except Exception as dot_err:
                    logger.warning(
                        f"Dot product error for CV {cv_raw.id}: {dot_err}"
                    )
                    continue

                dense_score = (dense_score + 1.0) / 2.0
                dense_score = max(0.0, min(1.0, dense_score))

                # -----------------------------------------
                # Skill Matching
                # -----------------------------------------

                try:

                    skill_res = matcher.match_skills(
                        cv_text,
                        job_skills,
                        str(job.id),
                        cv_vec
                    )

                except Exception as matcher_err:

                    logger.warning(
                        f"Matcher failure for CV {cv_raw.id}: {matcher_err}"
                    )
                    continue

                matched = skill_res.get("matched_skills", [])
                missing = skill_res.get("missing_skills", [])

                sparse_score = skill_res.get("match_percentage", 0.0) / 100.0

                s_score = skill_scorer.weighted_score(
                    matched,
                    job_skills
                )

                # -----------------------------------------
                # Final Fusion Score
                # -----------------------------------------

                final_score = fusion_engine.fuse(
                    float(dense_score),
                    float(sparse_score),
                    float(s_score)
                )

                # -----------------------------------------
                # Store Result
                # -----------------------------------------

                all_candidates_results.append({

                    "cv_id": str(cv_raw.id),

                    "final_score": round(final_score * 100, 2),

                    "details": {

                        "skill_score":
                            round(float(s_score) * 100, 2),

                        "semantic_score":
                            round(float(dense_score) * 100, 2),

                        "keyword_match_score":
                            round(float(sparse_score) * 100, 2),

                        "matched_skills":
                            matched,

                        "missing_skills":
                            missing,

                        "match_percentage":
                            skill_res.get("match_percentage", 0.0)
                    }
                })

            except Exception as cv_error:

                logger.error(
                    f"Error processing CV {cv_raw.id}: {cv_error}",
                    exc_info=True
                )

                continue

        # ---------------------------------------------------
        # Sort results
        # ---------------------------------------------------

        all_candidates_results.sort(
            key=lambda x: x["final_score"],
            reverse=True
        )

    except Exception as e:

        logger.error(
            f"General Ranking Error: {e}",
            exc_info=True
        )

    return all_candidates_results