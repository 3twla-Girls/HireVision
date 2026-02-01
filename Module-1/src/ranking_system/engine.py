import logging
from typing import List, Dict, Any, Optional
from ranking_system.utils import parse_cv, mask_pii, normalize_skills
from ranking_system.skill_scoring import SkillImportanceScorer
from ranking_system.matcher import HybridSkillMatcher
from ranking_system.ranker import DualRetriever, FusionEngine, ContextAwareReranker

logger = logging.getLogger("uvicorn.error")

def rank_jobs_for_cv(cv_path: str, jobs: List[Dict], embedder: Any, config: Dict) -> Optional[List]:
    """
    تقارن CV واحد بمجموعة وظائف. تم تحسينها لتقليل استهلاك الذاكرة.
    """
    try:
        if not jobs:
            logger.warning("No jobs provided for ranking.")
            return []

        cv_text = parse_cv(cv_path)
        if not cv_text:
            logger.error(f"Failed to parse CV at path: {cv_path}")
            return None
            
        cv_text = mask_pii(cv_text)
        cv_text = normalize_skills(cv_text)
        cv_meta = {}

        cv_text_lower, cv_emb = embedder.embed_cv(cv_path, cv_text)
        job_texts = [job.get("text", "") for job in jobs]
        jobs_key = embedder.cache.get_jobs_key(jobs, embedder.model_name)
        job_embeddings = embedder.embed_texts(job_texts, cache_key=jobs_key)

        matcher = HybridSkillMatcher(embedder, config)
        skill_scorer = SkillImportanceScorer()
        fusion_engine = FusionEngine()
        
        all_job_skills = list({skill for job in jobs for skill in job.get("skills", [])})
        skill_results = matcher.match_skills(cv_text, all_job_skills)

        for job in jobs:
            job_skills = job.get("skills", [])
            matched = [s for s in job_skills if s in skill_results["matched_skills"]]
            missing = [s for s in job_skills if s not in matched]

            score = skill_scorer.weighted_score(matched, job_skills)
            job["skill_score"] = min(max(score, 0.0), 1.0)
            job["matched_skills"] = matched
            job["missing_skills"] = missing

            skill_results[job.get("title", "Unknown")] = {
                "weighted_score": job["skill_score"],
                "matched_skills": matched,
                "missing_skills": missing
            }

        retriever = DualRetriever(embedder.dim, job_texts, job_embeddings, jobs)
        retrieved = retriever.retrieve(cv_emb, cv_text, k=config.get("top_k_retriever", 10))

        candidates = []
        for job, dense_score, sparse_score in retrieved:
            f_score = fusion_engine.fuse(dense_score, sparse_score, job.get("skill_score", 0))
            candidates.append({
                "retrieval_data": job,
                "fusion_score": min(max(f_score, 0.0), 1.0)
            })

        reranker = ContextAwareReranker()
        return reranker.rerank(
            cv_text, cv_meta, candidates, skill_results, k=config.get("top_k_rerank", 5)
        )

    except Exception as e:
        logger.error(f"Critical error in rank_jobs_for_cv: {str(e)}", exc_info=True)
        return None

def rank_cvs_for_job(job_data: Dict, cv_paths_list: List[str], embedder: Any, config: Dict) -> List:
    all_candidates_results = []
    
    try:
        job_text = job_data.get("job_description", job_data.get("text", ""))
        job_skills = job_data.get("required_skills", job_data.get("skills", []))
        
        job_embedding = embedder.embed_texts([job_text])
        
        matcher = HybridSkillMatcher(embedder, config)
        skill_scorer = SkillImportanceScorer()
        fusion_engine = FusionEngine()

        for cv_path in cv_paths_list:
            try:
                cv_raw = parse_cv(cv_path)
                if not cv_raw: continue
                
                cv_text = normalize_skills(mask_pii(cv_raw))
                _, cv_emb = embedder.embed_cv(cv_path, cv_text)

                # Skill Matching
                skill_res = matcher.match_skills(cv_text, job_skills)
                matched = [s for s in job_skills if s in skill_res["matched_skills"]]
                missing = [s for s in job_skills if s not in matched]
                s_score = skill_scorer.weighted_score(matched, job_skills)

                from numpy import dot
                from numpy.linalg import norm
                
                dense_score = dot(cv_emb, job_embedding[0]) / (norm(cv_emb) * norm(job_embedding[0]))
                
                sparse_score = len(matched) / len(job_skills) if job_skills else 0
                
                f_score = fusion_engine.fuse(float(dense_score), float(sparse_score), s_score)

                all_candidates_results.append({
                    "cv_path": cv_path,
                    "final_score": round(min(f_score * 100, 100), 2),
                    "details": {
                        "skill_score": round(s_score * 100, 2),
                        "semantic_score": round(float(dense_score) * 100, 2),
                        "matched_skills": matched,
                        "missing_skills": missing
                    }
                })

            except Exception as cv_err:
                logger.error(f"Error processing CV {cv_path}: {cv_err}")
                continue

        all_candidates_results.sort(key=lambda x: x['final_score'], reverse=True)
        
    except Exception as e:
        logger.error(f"General Ranking Error: {e}", exc_info=True)

    return all_candidates_results