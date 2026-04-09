import os
import pickle
import numpy as np
import faiss

from sentence_transformers import SentenceTransformer
from Server.helpers.config import get_settings


class JobSkillsStore:

    def __init__(
        self,
        path="./Module_1/faiss_store/job_skill_embeddings.pkl"
    ):

        self.path = path

        settings = get_settings()

        self.model = SentenceTransformer(settings.EMBED_MODEL)

        if os.path.exists(self.path):

            with open(self.path, "rb") as f:
                self.store = pickle.load(f)

        else:

            self.store = {}
    def _reload(self):
        if os.path.exists(self.path):
            with open(self.path, "rb") as f:
                self.store = pickle.load(f)
        else:
            self.store = {}
            
    def save(self):

        with open(self.path, "wb") as f:
            pickle.dump(self.store, f)

    def process_job_skills(self, job_id, skills):

        skill_embeddings = {}

        for skill in skills:

            emb = self.model.encode(skill)

            emb = np.array([emb]).astype("float32")

            faiss.normalize_L2(emb)

            skill_embeddings[skill] = emb[0]

        self.store[job_id] = {

            "skills_list": skills,

            "skills_embeddings": skill_embeddings
        }

        self.save()

        return {

            "job_id": job_id,

            "stored_skills": len(skills)
        }

    def get_job_skills(self, job_id):
        self._reload()
        print(f"Retrieving skills for job_id: {self.store.get(job_id)}")
        return self.store.get(job_id)
    
    def delete_job_skills_embeddings(self, job_id):
        self._reload()
        if job_id not in self.store:
            return {
                "job_id": job_id,
                "status": "not_found"
            }

        skills_count = len(self.store[job_id].get("skills_list", []))

        del self.store[job_id]

        self.save()

        return {
            "job_id": job_id,
            "deleted_skills_count": skills_count,
            "status": "success"
        }