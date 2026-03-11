import os
import faiss
import numpy as np
import pickle
from typing import List

from bson import ObjectId
from sentence_transformers import SentenceTransformer

from Server.helpers.config import get_settings


class FAISSService:
    """FAISS service for managing embeddings and similarity search."""
    def __init__(self, dimension=1024,
                 index_path="../Module-1/faiss_store/cv_embeddings.index",
                 mapping_path="../Module-1/faiss_store/id_mapping.pkl",
                 embedding_store_path="../Module-1/faiss_store/embedding_store.pkl"):

        self.dimension = dimension
        self.index_path = index_path
        self.mapping_path = mapping_path
        self.embedding_store_path = embedding_store_path

        app_settings = get_settings()
        os.makedirs(os.path.dirname(index_path), exist_ok=True)

        # Load embedding model
        self.model = SentenceTransformer(app_settings.EMBED_MODEL)

        # Load or create FAISS index
        if os.path.exists(self.index_path):
            self.index = faiss.read_index(self.index_path)
        else:
            base_index = faiss.IndexFlatIP(self.dimension)  # cosine similarity
            self.index = faiss.IndexIDMap(base_index)
            faiss.write_index(self.index, self.index_path)

        # Load ID mapping
        if os.path.exists(self.mapping_path):
            with open(self.mapping_path, "rb") as f:
                self.id_mapping = pickle.load(f)  # {faiss_id: mongo_id}
        else:
            self.id_mapping = {}

        # Load embedding store
        if os.path.exists(self.embedding_store_path):
            with open(self.embedding_store_path, "rb") as f:
                self.embedding_store = pickle.load(f)  # {mongo_id: vector}
        else:
            self.embedding_store = {}

    # -----------------------------
    # Save all to disk
    # -----------------------------
    def _save_all(self):
        faiss.write_index(self.index, self.index_path)
        with open(self.mapping_path, "wb") as f:
            pickle.dump(self.id_mapping, f)
        with open(self.embedding_store_path, "wb") as f:
            pickle.dump(self.embedding_store, f)

    # -----------------------------
    # Convert Mongo ObjectId → int64
    # -----------------------------
    def _mongo_to_faiss_id(self, mongo_id: ObjectId) -> int:
        return int(str(mongo_id), 16) % (2**63 - 1)

    # -----------------------------
    # Convert text → normalized embedding
    # -----------------------------
    def _text_to_embedding(self, text: str):
        embedding = self.model.encode(text)
        embedding = np.array([embedding]).astype("float32")
        # Normalize for cosine similarity
        faiss.normalize_L2(embedding)
        return embedding

    # -----------------------------
    # Add/update CV
    # -----------------------------
    def process_cv(self, mongo_id: str, text: str, top_k: int = 5):
        mongo_object_id = ObjectId(mongo_id)
        faiss_id = self._mongo_to_faiss_id(mongo_object_id)

        vector = self._text_to_embedding(text)
        id_array = np.array([faiss_id], dtype=np.int64)

        # Remove old embedding if exists (update case)
        self.index.remove_ids(id_array)

        # Add new embedding
        self.index.add_with_ids(vector, id_array)

        # Save mappings
        self.id_mapping[faiss_id] = mongo_id
        self.embedding_store[mongo_id] = vector[0]  # store single embedding

        self._save_all()
        return {
            "stored_mongo_id": mongo_id
        }

    # -----------------------------
    # Get embedding by Mongo ID
    # -----------------------------
    def get_embedding_by_mongo_id(self, mongo_id: str):

        vector = self.embedding_store.get(mongo_id)

        if vector is None:
            return None

        # Handle old corrupted format
        if isinstance(vector, dict):
            vector = vector.get("embedding")

        # Convert to numpy
        try:
            vector = np.array(vector, dtype="float32").flatten()
        except Exception:
            return None

        return {
            "mongo_id": mongo_id,
            "embedding": vector
        }
    # -----------------------------
    # Delete CV by Mongo ID
    # -----------------------------
    def delete_cv_by_mongo_id(self, mongo_id: str):
        mongo_object_id = ObjectId(mongo_id)
        faiss_id = self._mongo_to_faiss_id(mongo_object_id)

        # Remove from FAISS index
        id_array = np.array([faiss_id], dtype=np.int64)
        self.index.remove_ids(id_array)

        # Remove from mapping and embedding store
        if faiss_id in self.id_mapping:
            del self.id_mapping[faiss_id]
        if mongo_id in self.embedding_store:
            del self.embedding_store[mongo_id]

        # Save changes
        self._save_all()

        return {"deleted_mongo_id": mongo_id, "status": "success"}
    
    # -----------------------------
    # Delete multiple CVs by Mongo IDs
    # -----------------------------
    def delete_cvs_by_mongo_ids(self, mongo_ids: List[str]):

        if not mongo_ids:
            return {"deleted_count": 0, "status": "no_ids_provided"}

        faiss_ids = []
        valid_mongo_ids = []

        # Convert Mongo IDs to FAISS IDs
        for mongo_id in mongo_ids:
            try:
                mongo_object_id = ObjectId(mongo_id)
                faiss_id = self._mongo_to_faiss_id(mongo_object_id)
                faiss_ids.append(faiss_id)
                valid_mongo_ids.append(mongo_id)
            except Exception:
                continue  # skip invalid IDs

        if not faiss_ids:
            return {"deleted_count": 0, "status": "no_valid_ids"}

        id_array = np.array(faiss_ids, dtype=np.int64)

        # Remove from FAISS index
        self.index.remove_ids(id_array)

        # Remove from mapping and embedding store
        for faiss_id, mongo_id in zip(faiss_ids, valid_mongo_ids):
            self.id_mapping.pop(faiss_id, None)
            self.embedding_store.pop(mongo_id, None)

        # Save once
        self._save_all()

        return {
        "deleted_count": len(valid_mongo_ids),
        "deleted_ids": valid_mongo_ids,
        "status": "success"
        }
        
    