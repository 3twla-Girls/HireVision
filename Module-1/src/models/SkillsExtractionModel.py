import time
import spacy
import numpy as np
import pandas as pd
import ast
import torch
from huggingface_hub import snapshot_download
from spacy.matcher import PhraseMatcher
from skillNer.general_params import SKILL_DB
from skillNer.skill_extractor_class import SkillExtractor
from sentence_transformers import SentenceTransformer, util
from typing import List, Dict
from .BaseDataModel import BaseDataModel


class SkillsExtractionModel(BaseDataModel):
    def __init__(self, embedding_model_name="mixedbread-ai/mxbai-embed-large-v1", verbose=False):
        self.verbose = verbose
        self.embedding_model_name = embedding_model_name
        self._load_models()

    # -----------------------------
    def _load_models(self):
        """Load all required models"""
        if self.verbose:
            print("🔄 Loading models...")

        # Load skill extraction models
        model_path = snapshot_download("amjad-awad/skill-extractor", repo_type="model")
        self.amjad_nlp = spacy.load(model_path)

        nlp_lg = spacy.load("en_core_web_lg")
        self.skillner = SkillExtractor(nlp_lg, SKILL_DB, PhraseMatcher)

        # Load embedding model
        self.embedding_model = SentenceTransformer(self.embedding_model_name)

        if self.verbose:
            print("✅ Models loaded")

    # -----------------------------
    def _extract_amjad(self, text: str) -> List[str]:
        """Extract skills using Amjad model"""
        return [ent.text for ent in self.amjad_nlp(text).ents if "SKILLS" in ent.label_]

    def _extract_skillner(self, text: str) -> List[str]:
        """Extract skills using SkillNER model"""
        annotations = self.skillner.annotate(text)
        skills = []
        for item in annotations["results"].get("full_matches", []) + annotations["results"].get("ngram_scored", []):
            skills.append(item["doc_node_value"])
        return skills

    # -----------------------------
    def extract_skills_combined(self, text: str) -> List[str]:
        """
        Extract skills using both models and combine results.
        Removes duplicates while preserving order.
        """
        skills = self._extract_amjad(text) + self._extract_skillner(text)
        seen = set()
        unique_skills = []
        for s in skills:
            if s and s.lower().strip() not in seen:
                seen.add(s.lower().strip())
                unique_skills.append(s.strip())
        return unique_skills

    # -----------------------------
    def get_skills_embeddings(self, text: str) -> Dict:
        """
        Extract skills from text and generate their embeddings.
        
        Returns:
            Dict with keys: 'skills', 'embeddings', 'embedding_dim'
        """
        skills = self.extract_skills_combined(text)
        
        if not skills:
            return {
                "skills": [], 
                "embeddings": np.empty((0, 1024)),
                "embedding_dim": 1024
            }

        try:
            embeddings = self.embedding_model.encode(skills, convert_to_numpy=True)
            
            return {
                "skills": skills, 
                "embeddings": embeddings, 
                "embedding_dim": embeddings.shape[1]
            }
        except Exception as e:
            print(f"❌ Error generating embeddings: {e}")
            return {
                "skills": [], 
                "embeddings": np.empty((0, 1024)),
                "embedding_dim": 1024
            }

    # -----------------------------
    def load_skills_database(self, skill_column="Skills", embedding_column="embedding", verbose=True):
        """Load the skills database with pre-computed embeddings"""
        try:
            df = pd.read_csv("./Skills_Dataset/skills_with_embeddings.csv")
            if verbose:
                print(f"✅ Loaded skills database: {len(df)} skills")
            return df
        except Exception as e:
            print(f"❌ Error loading skills database: {e}")
            return pd.DataFrame()

    # -----------------------------
    def filter_skills_by_similarity(self, skills_list, skills_embeddings, df,
                                    skill_column="Skills", embedding_column="embedding",
                                    similarity_threshold=0.9, verbose=True):
        """
        Filter extracted skills by comparing with database skills.
        
        Args:
            skills_list: List of extracted skills
            skills_embeddings: Embeddings of extracted skills
            df: DataFrame with database skills and embeddings
            skill_column: Column name for skills in database
            embedding_column: Column name for embeddings in database
            similarity_threshold: Minimum similarity score to match
            verbose: Print debug information
            
        Returns:
            Dict with matched skills and metadata
        """

        if df.empty or len(skills_list) == 0 or skills_embeddings.shape[0] == 0:
            return {
                'matched_skills': [], 
                'unmatched_skills': [], 
                'skill_mappings': {}, 
                'similarities': {}, 
                'matched_count': 0, 
                'unmatched_count': 0
            }

        try:
            # Convert database embeddings
            db_embeddings = np.array([ast.literal_eval(x) for x in df[embedding_column]], dtype=np.float32)
            input_embeddings = skills_embeddings.astype(np.float32)

            # Calculate similarities
            similarities = util.cos_sim(torch.tensor(input_embeddings), torch.tensor(db_embeddings))

            matched = []
            db_skills = df[skill_column].tolist()

            # Find matches above threshold
            for i, skill in enumerate(skills_list):
                best_idx = similarities[i].argmax().item()
                best_score = similarities[i][best_idx].item()
                if best_score >= similarity_threshold:
                    matched.append(skill)

            if verbose and matched:
                print(f"✅ Matched {len(matched)}/{len(skills_list)} skills")

            return {
                'matched_skills': matched, 
                'unmatched_skills': [], 
                'skill_mappings': {}, 
                'similarities': {}, 
                'matched_count': len(matched), 
                'unmatched_count': 0
            }
            
        except Exception as e:
            print(f"❌ Error in filter_skills_by_similarity: {e}")
            return {
                'matched_skills': [], 
                'unmatched_skills': [], 
                'skill_mappings': {}, 
                'similarities': {}, 
                'matched_count': 0, 
                'unmatched_count': 0
            }

    # -----------------------------
    def embed_job_roles(self, job_roles):
        """
        Generate embeddings for job roles.
        
        Args:
            job_roles: String or list of strings
            
        Returns:
            numpy array of embeddings
        """
        if isinstance(job_roles, str):
            job_roles = [job_roles]
        return self.embedding_model.encode(job_roles, convert_to_numpy=True)