# -----------------------------
# 1) Load CV
# -----------------------------
cv_path = "/content/Shrouk_s_Resume.pdf"   # عدّلي هنا
cv_text = parse_cv(cv_path)
cv_text = mask_pii(cv_text)
cv_text = normalize_skills(cv_text)

# -----------------------------
# 2) CV metadata (NOT USED NOW, but keep empty dict)
# -----------------------------
cv_meta = {}
print("📊 CV Metadata skipped (Skill-only mode)")

# -----------------------------
# 3) Load Jobs & skills
# -----------------------------
all_job_skills = list({skill for job in jobs for skill in job.get("skills", [])})

# -----------------------------
# 4) Embeddings
# -----------------------------
embedder = EmbeddingManager()
cv_text_lower, cv_emb = embedder.embed_cv(cv_path, cv_text)

job_texts = [job["text"] for job in jobs]
jobs_key = embedder.cache.get_jobs_key(jobs, embedder.model_name)
job_embeddings = embedder.embed_texts(job_texts, cache_key=jobs_key)

# -----------------------------
# 5) Skill Matching
# -----------------------------
matcher = HybridSkillMatcher(embedder)
skill_results = matcher.match_skills(cv_text, all_job_skills)

skill_scorer = SkillImportanceScorer()

for job in jobs:
    job_skills = job.get("skills", [])
    matched = [s for s in job_skills if s in skill_results["matched_skills"]]
    missing = [s for s in job_skills if s not in matched]

    # This now returns 0-1 already
    score = skill_scorer.weighted_score(matched, job_skills)
    score = min(max(score, 0.0), 1.0)  # Just clip, don't divide

    job["skill_score"] = score
    job["matched_skills"] = matched
    job["missing_skills"] = missing

    skill_results[job["title"]] = {
        "weighted_score": score,  # Already 0-1
        "matched_skills": matched,
        "missing_skills": missing
    }

# -----------------------------
# 6) Retrieval
# -----------------------------
retriever = DualRetriever(embedder.dim, job_texts, job_embeddings, jobs)
retrieved = retriever.retrieve(cv_emb, cv_text, k=CONFIG["top_k_retriever"])

# -----------------------------
# 7) Fusion
# -----------------------------
fusion_engine = FusionEngine()
candidates = []
for job, dense_score, sparse_score in retrieved:
    # FIX: Only 3 parameters now
    fusion_score = fusion_engine.fuse(
        dense_score, sparse_score, job["skill_score"]
    )
    fusion_score = min(max(fusion_score, 0.0), 1.0)
    candidates.append({
        "retrieval_data": job,
        "fusion_score": fusion_score
    })

# -----------------------------
# 8) Reranking (Skill-Only)
# -----------------------------
reranker = ContextAwareReranker()
reranked = reranker.rerank(
    cv_text, cv_meta, candidates, skill_results, k=CONFIG["top_k_rerank"]
)

# -----------------------------
# 9) Final Results (Clean Output)
# -----------------------------
print("\n\n==================== FINAL JOB MATCH RESULTS ====================\n")

for i, (job, scores) in enumerate(reranked, 1):
    print(f"🏆 Rank {i}: {job['title']}")
    print(f"   🔥 Match Percentage: {scores['final_score']:.2f}%")  # Already percentage

    matched = job.get("matched_skills", [])
    missing = job.get("missing_skills", [])

    print(f"   ✅ Skills Matched ({len(matched)}): {', '.join(matched[:5]) if matched else 'None'}")
    if len(matched) > 5:
        print(f"      ... and {len(matched) - 5} more")
    print(f"   ❌ Skills Missing ({len(missing)}): {', '.join(missing[:5]) if missing else 'None'}")
    if len(missing) > 5:
        print(f"      ... and {len(missing) - 5} more")

    # All scores already in percentage
    print(f"   📘 Skill Score: {scores['skill_match']:.2f}%")
    print(f"   🤖 Cross-Encoder Score: {scores['ce_score']:.2f}%")
    print(f"   🔍 Retrieval Score: {scores['retrieval_score']:.2f}%")

    print("-" * 65)
