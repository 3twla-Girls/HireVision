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
    # MODEL LOADING
    # -----------------------------
    def _load_models(self):
        if self.verbose:
            print("🔄 Loading models...")

        model_path = snapshot_download("amjad-awad/skill-extractor", repo_type="model")
        self.amjad_nlp = spacy.load(model_path)

        nlp_lg = spacy.load("en_core_web_lg")
        self.skillner = SkillExtractor(nlp_lg, SKILL_DB, PhraseMatcher)

        self.embedding_model = SentenceTransformer(self.embedding_model_name)

        if self.verbose:
            print("✅ Models loaded")

    # -----------------------------
    # TEXT SANITIZER (CRASH SHIELD)
    # -----------------------------
    def _clean_text(self, text: str) -> str:
        if not text:
            return ""
        text = text.encode("utf-8", "ignore").decode("utf-8")
        text = text.replace("\x00", " ")
        text = " ".join(text.split())
        return text.strip()

    # -----------------------------
    # AMJAD EXTRACTOR
    # -----------------------------
    def _extract_amjad(self, text: str) -> List[str]:
        try:
            if not text or len(text.split()) < 3:
                return []
            doc = self.amjad_nlp(text[:50000])  # prevent very large input
            return [ent.text for ent in doc.ents if "SKILLS" in ent.label_]
        except Exception as e:
            print(f"⚠️ Amjad extractor failed: {e}")
            return []

    # -----------------------------
    # SKILLNER EXTRACTOR (FIXED)
    # -----------------------------
    def _extract_skillner(self, text: str) -> List[str]:
        try:
            if not text or len(text.split()) < 3:
                return []

            annotations = self.skillner.annotate(text[:50000])

            if not annotations or "results" not in annotations:
                return []

            skills = []
            results = annotations["results"]

            for item in results.get("full_matches", []) + results.get("ngram_scored", []):
                val = item.get("doc_node_value")
                if val:
                    skills.append(val)

            return skills

        except Exception as e:
            print(f"⚠️ SkillNer crashed safely: {e}")
            return []

    # -----------------------------
    # COMBINED EXTRACTION
    # -----------------------------
    def extract_skills_combined(self, text: str) -> List[str]:
        text = self._clean_text(text)

        if len(text) < 10:
            return []

        skills = []
        skills += self._extract_amjad(text)
        skills += self._extract_skillner(text)

        seen = set()
        unique_skills = []

        for s in skills:
            key = s.lower().strip()
            if key and key not in seen:
                seen.add(key)
                unique_skills.append(s.strip())

        return unique_skills

    # -----------------------------
    # EMBEDDINGS
    # -----------------------------
    def get_skills_embeddings(self, text: str) -> Dict:
        skills = self.extract_skills_combined(text)
        dim = self.embedding_model.get_sentence_embedding_dimension()

        if not skills:
            return {
                "skills": [],
                "embeddings": np.zeros((0, dim)),
                "embedding_dim": dim
            }

        try:
            embeddings = self.embedding_model.encode(skills, convert_to_numpy=True)
            return {
                "skills": skills,
                "embeddings": embeddings,
                "embedding_dim": embeddings.shape[1]
            }
        except Exception as e:
            print(f"❌ Embedding error: {e}")
            return {
                "skills": [],
                "embeddings": np.zeros((0, dim)),
                "embedding_dim": dim
            }

    # -----------------------------
    # LOAD SKILLS DATABASE
    # -----------------------------
    def load_skills_database(self, skill_column="Skills", embedding_column="embedding", verbose=True):
        try:
            df = pd.read_csv("./Skills_Dataset/skills_with_embeddings.csv")
            if verbose:
                print(f"✅ Loaded skills database: {len(df)} skills")
            return df
        except Exception as e:
            print(f"❌ Error loading skills database: {e}")
            return pd.DataFrame()

    # -----------------------------
    # SIMILARITY FILTER
    # -----------------------------
    def filter_skills_by_similarity(self, skills_list, skills_embeddings, df,
                                    skill_column="Skills", embedding_column="embedding",
                                    similarity_threshold=0.9, verbose=True):

        if df.empty or len(skills_list) == 0 or skills_embeddings.shape[0] == 0:
            return {'matched_skills': [], 'unmatched_skills': [], 'matched_count': 0}

        try:
            db_embeddings = np.array([ast.literal_eval(x) for x in df[embedding_column]], dtype=np.float32)
            input_embeddings = skills_embeddings.astype(np.float32)

            similarities = util.cos_sim(torch.tensor(input_embeddings), torch.tensor(db_embeddings))

            matched = []
            db_skills = df[skill_column].tolist()

            for i, skill in enumerate(skills_list):
                best_idx = similarities[i].argmax().item()
                best_score = similarities[i][best_idx].item()
                if best_score >= similarity_threshold:
                    matched.append(skill)

            if verbose:
                print(f"✅ Matched {len(matched)}/{len(skills_list)} skills")

            return {
                'matched_skills': matched,
                'unmatched_skills': list(set(skills_list) - set(matched)),
                'matched_count': len(matched)
            }

        except Exception as e:
            print(f"❌ Similarity filter error: {e}")
            return {'matched_skills': [], 'unmatched_skills': [], 'matched_count': 0}

    # -----------------------------
    # JOB ROLE EMBEDDINGS
    # -----------------------------
    def embed_job_roles(self, job_roles):
        if isinstance(job_roles, str):
            job_roles = [job_roles]
        return self.embedding_model.encode(job_roles, convert_to_numpy=True)
