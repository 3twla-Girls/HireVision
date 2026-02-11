import numpy as np
from typing import List, Dict
from .BaseController import BaseController
from models.SkillsExtractionModel import SkillsExtractionModel


class SkillsController(BaseController):
    def __init__(self, embedding_model_name: str = "mixedbread-ai/mxbai-embed-large-v1", verbose: bool = True):
        self.verbose = verbose
        self.model = SkillsExtractionModel(embedding_model_name=embedding_model_name, verbose=verbose)
        self.df_skills = self.model.load_skills_database()

        if self.verbose:
            print("✅ SkillsController initialized")

    # -----------------------------
    def extract_skills_from_cv(self, cv_text: str) -> Dict:
        """Extract skills and their embeddings from CV text"""
        return self.model.get_skills_embeddings(cv_text)

    # -----------------------------
    def filter_skills(self, skills: List[str], embeddings: np.ndarray) -> Dict:
        """Filter skills based on similarity to skills database"""
        return self.model.filter_skills_by_similarity(
            skills_list=skills,
            skills_embeddings=embeddings,
            df=self.df_skills,
            skill_column="Skills",
            embedding_column="embedding",
            similarity_threshold=0.75,
            verbose=False
        )

    # -----------------------------
    def process_cv(self, cv_text: str) -> Dict:
        try:
            # Extract skills and embeddings
            skill_data = self.extract_skills_from_cv(cv_text)
            # 🛑 No skills extracted
            if not skill_data["skills"] or skill_data["embeddings"].shape[0] == 0:
                print("⚠️ No skills extracted from CV")
                return {"skills": [], "skills_embeddings": []}

            # 🛑 Safety check
            if len(skill_data["skills"]) != len(skill_data["embeddings"]):
                raise ValueError(f"Mismatch between skills ({len(skill_data['skills'])}) and embeddings ({len(skill_data['embeddings'])}) count")

            # Filter skills based on database
            filtered_result = self.filter_skills(
                skill_data["skills"],
                skill_data["embeddings"]
            )

            # 🔥 SAFE mapping: map filtered skills to their embeddings
            safe_skills = []
            safe_embeddings = []

            # Create a mapping from skill to embedding
            skill_to_embedding = {
                skill_data["skills"][i]: skill_data["embeddings"][i]
                for i in range(len(skill_data["skills"]))
            }

            # Only include skills that passed the filter
            for skill in filtered_result["matched_skills"]:
                if skill in skill_to_embedding:
                    emb = skill_to_embedding[skill]
                    if isinstance(emb, np.ndarray) and emb.size > 0:
                        safe_skills.append(skill)
                        safe_embeddings.append(emb.tolist())

            # ✅ Validation: ensure we have valid data
            if len(safe_skills) == 0 or len(safe_embeddings) == 0:
                print(f"⚠️ Warning: No valid skills after filtering (extracted {len(skill_data['skills'])}, matched 0)")
                return {"skills": [], "skills_embeddings": []}

            print(f"✅ Processed CV: {len(safe_skills)} skills matched from {len(skill_data['skills'])} extracted")

            return {
                "skills": safe_skills,
                "skills_embeddings": safe_embeddings
            }
            
        except Exception as e:
            print(f"❌ Error in process_cv: {e}")
            import traceback
            traceback.print_exc()
            return {"skills": [], "skills_embeddings": []}