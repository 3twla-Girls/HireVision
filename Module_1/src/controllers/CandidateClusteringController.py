# controllers/CandidateClusteringController.py

import numpy as np
from typing import List, Union
from ..models.CandidateClusteringModel import CandidateClusteringModel


class CandidateClusteringController():

    def __init__(self, embedding_dim: int = 1024, threshold: float = 0.9):
        
        self.model = CandidateClusteringModel(
            embedding_dim=embedding_dim,
            similarity_threshold=threshold
        )

    # -------------------------------------------------
    # Helper: Flatten and normalize embedding
    # -------------------------------------------------
    def _process_embedding(self, embedding: Union[List, np.ndarray], target_dim: int) -> np.ndarray:
        """
        Process a single embedding to ensure correct shape and dimension.
        Handles nested lists and various shapes.
        """
        # Convert to numpy array
        emb = np.array(embedding, dtype="float32")
        
        # Flatten if nested
        if emb.ndim > 1:
            emb = emb.flatten()
        
        # Validate dimension
        if len(emb) == 0:
            raise ValueError("Empty embedding provided")
        
        # Adjust dimension if needed
        if len(emb) != target_dim:
            if len(emb) < target_dim:
                # Pad with zeros
                emb = np.pad(emb, (0, target_dim - len(emb)), mode='constant')
            else:
                # Truncate
                emb = emb[:target_dim]
        
        return emb

    # -------------------------------------------------
    # Build candidate vector combining job role + skills
    # -------------------------------------------------
    def build_candidate_vector(self, job_embedding: Union[List, np.ndarray], 
                               skills_embeddings: List[Union[List, np.ndarray]], 
                               target_dim: int) -> np.ndarray:
        """
        Build a combined vector from job role and skills embeddings.
        
        Args:
            job_embedding: Job role embedding vector
            skills_embeddings: List of skill embedding vectors
            target_dim: Target dimension for embeddings
            
        Returns:
            Combined normalized vector
        """
        
        # Process job embedding
        try:
            job_emb = self._process_embedding(job_embedding, target_dim)
        except Exception as e:
            print(f"⚠️ Error processing job embedding: {e}")
            raise ValueError(f"Invalid job embedding: {e}")
        
        # If no skills, return only job embedding (normalized)
        if not skills_embeddings or len(skills_embeddings) == 0:
            norm = np.linalg.norm(job_emb)
            if norm > 0:
                job_emb = job_emb / norm
            return job_emb.astype("float32")
        
        # Process all skills embeddings
        valid_skill_embeddings = []
        for idx, skill_emb in enumerate(skills_embeddings):
            try:
                processed_skill = self._process_embedding(skill_emb, target_dim)
                valid_skill_embeddings.append(processed_skill)
            except Exception as e:
                print(f"⚠️ Warning: Skipping invalid skill embedding at index {idx}: {e}")
                continue
        
        # If no valid skills after processing, return job embedding only
        if len(valid_skill_embeddings) == 0:
            print(f"⚠️ No valid skills embeddings, using job embedding only")
            norm = np.linalg.norm(job_emb)
            if norm > 0:
                job_emb = job_emb / norm
            return job_emb.astype("float32")
        
        # Combine job and skills with weighting
        # Give more weight to skills (80%) vs job role (20%)
        skills_mean = np.mean(valid_skill_embeddings, axis=0)
        combined =0.2 * job_emb + 0.8* skills_mean
        
        # Normalize the combined vector for cosine similarity
        norm = np.linalg.norm(combined)
        if norm > 0:
            combined = combined / norm
        else:
            # Fallback to job embedding if combined is zero
            combined = job_emb / np.linalg.norm(job_emb)
            
        return combined.astype("float32")

    # -------------------------------------------------
    def cluster_candidate(self, candidate_id: str, 
                          job_role_embedding: Union[List, np.ndarray],
                          skills_embeddings: List[Union[List, np.ndarray]]) -> int:
        """
        Cluster a candidate based on job role and skills embeddings.
        
        Args:
            candidate_id: Unique identifier for the candidate
            job_role_embedding: Embedding vector for the job role
            skills_embeddings: List of embedding vectors for skills
            
        Returns:
            cluster_id: ID of the assigned cluster
        """
        try:
            # Debug logging
            print(f"🔍 Clustering candidate: {candidate_id}")
            print(f"📊 Job embedding type: {type(job_role_embedding)}, shape: {np.array(job_role_embedding).shape}")
            print(f"📊 Number of skills: {len(skills_embeddings) if skills_embeddings else 0}")
            if skills_embeddings and len(skills_embeddings) > 0:
                print(f"📊 First skill embedding shape: {np.array(skills_embeddings[0]).shape}")
            
            # Build combined vector
            vec = self.build_candidate_vector(
                job_role_embedding, 
                skills_embeddings, 
                self.model.embedding_dim
            )
            
            print(f"📊 Final vector shape: {vec.shape}")
            
            # Add to cluster
            cluster_id = self.model.add_candidate(vec, candidate_id)
            
            # Log cluster statistics
            stats = self.model.get_cluster_stats()
            print(f"📊 Candidate '{candidate_id}' → Cluster {cluster_id}")
            print(f"📊 Total clusters: {stats['total_clusters']}")
            
            return cluster_id
            
        except Exception as e:
            print(f"❌ Error clustering candidate '{candidate_id}': {e}")
            import traceback
            traceback.print_exc()
            raise

    # -------------------------------------------------
    def get_similar_candidates(self, cluster_id: int) -> List[str]:
        """Get all candidates in the same cluster"""
        return self.model.get_cluster_candidates(cluster_id)

    # -------------------------------------------------
    def save_clusters(self, path: str = "../../Module-1/src/candidate_clusters.pkl"):
        """Save cluster state to disk"""
        self.model.save(path)
        print(f"💾 Saved clusters to {path}")

    def load_clusters(self, path: str = "../../Module-1/src/candidate_clusters.pkl"):
        """Load cluster state from disk"""
        self.model = CandidateClusteringModel.load(path)
        print(f"📂 Loaded clusters from {path}")