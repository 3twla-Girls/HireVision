"""Candidate clustering model using FAISS for similarity search."""
import numpy as np
import faiss
import pickle
from typing import Dict, List


class CandidateClusteringModel:
    def __init__(self, embedding_dim: int, similarity_threshold: float = 0.85):
        self.embedding_dim = embedding_dim
        self.similarity_threshold = similarity_threshold

        self.centroids = np.zeros((0, embedding_dim), dtype="float32")
        self.cluster_members: Dict[int, List[np.ndarray]] = {}
        self.candidate_metadata: Dict[int, List[str]] = {}

        # COSINE similarity → Inner Product index
        self.index = faiss.IndexFlatIP(embedding_dim)

        self.next_cluster_id = 0

    # -------------------------------------------------
    # Normalize vectors for cosine similarity
    # -------------------------------------------------
    def _normalize(self, vec):
        """Normalize a vector for cosine similarity"""
        norm = np.linalg.norm(vec)
        if norm == 0:
            return vec
        return vec / norm

    # -------------------------------------------------
    # Add candidate vector to cluster
    # -------------------------------------------------
    def add_candidate(self, embedding: np.ndarray, candidate_id: str) -> int:
        embedding = embedding.astype("float32").reshape(1, -1)
        embedding = self._normalize(embedding)

        if len(self.centroids) == 0:
            return self._create_new_cluster(embedding, candidate_id)

        similarities, indices = self.index.search(embedding, 1)
        best_sim = similarities[0][0]
        nearest_cluster = indices[0][0]

        # ADAPTIVE THRESHOLD
        cluster_size = len(self.cluster_members[nearest_cluster])
        threshold = 0.94
    
        print(f"🔎 Cluster {nearest_cluster} size={cluster_size}, threshold={threshold:.2f}, sim={best_sim:.4f}")

        if best_sim >= threshold:
            print(f"✅ Adding to cluster {nearest_cluster}")
            self.cluster_members[nearest_cluster].append(embedding)
            self.candidate_metadata[nearest_cluster].append(candidate_id)
            self._update_centroid_weighted(nearest_cluster, embedding)
            return nearest_cluster

        return self._create_new_cluster(embedding, candidate_id)

    # -------------------------------------------------
    def _create_new_cluster(self, embedding, candidate_id):
        """Create a new cluster with the given candidate"""
        cid = self.next_cluster_id

        self.centroids = np.vstack([self.centroids, embedding])
        self.cluster_members[cid] = [embedding]
        self.candidate_metadata[cid] = [candidate_id]

        self.index.add(embedding)

        self.next_cluster_id += 1

        print(f"✨ Created new cluster {cid} (total clusters: {self.next_cluster_id})")
        return cid

    # -------------------------------------------------
    # Weighted centroid update (prevents drift)
    # -------------------------------------------------
    def _update_centroid_weighted(self, cluster_id: int, new_embedding: np.ndarray):
        """
        Update centroid using weighted average instead of recalculating from all members.
        This prevents centroid drift and maintains cluster stability.
        """
        n = len(self.cluster_members[cluster_id])
        current_centroid = self.centroids[cluster_id].reshape(1, -1)
        
        # Weighted update: give more weight to existing centroid
        alpha = 0.3  # Weight for new embedding (lower = more stable clusters)
        new_centroid = (1 - alpha) * current_centroid + alpha * new_embedding
        new_centroid = self._normalize(new_centroid)

        self.centroids[cluster_id] = new_centroid.flatten()

        # Rebuild FAISS index
        self.index.reset()
        self.index.add(self.centroids)

    # -------------------------------------------------
    def get_cluster_candidates(self, cluster_id: int) -> List[str]:
        """Get all candidates in a specific cluster"""
        return self.candidate_metadata.get(cluster_id, [])

    # -------------------------------------------------
    def get_cluster_stats(self):
        """Get statistics about clusters"""
        stats = {
            "total_clusters": self.next_cluster_id,
            "total_candidates": sum(len(members) for members in self.cluster_members.values()),
            "cluster_sizes": {cid: len(members) for cid, members in self.cluster_members.items()},
            "average_cluster_size": sum(len(members) for members in self.cluster_members.values()) / max(self.next_cluster_id, 1)
        }
        return stats

    # -------------------------------------------------
    def save(self, path: str):
        """Save cluster state to disk"""
        with open(path, "wb") as f:
            pickle.dump(self.__dict__, f)

    @classmethod
    def load(cls, path: str):
        """Load cluster state from disk"""
        with open(path, "rb") as f:
            data = pickle.load(f)

        obj = cls(data["embedding_dim"], data["similarity_threshold"])
        obj.__dict__.update(data)

        # Rebuild FAISS index
        obj.index = faiss.IndexFlatIP(obj.embedding_dim)
        if len(obj.centroids) > 0:
            obj.index.add(obj.centroids)

        return obj