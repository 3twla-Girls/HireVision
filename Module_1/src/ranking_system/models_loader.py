"""
Embedding Model Loader - Manages SentenceTransformer for embeddings
"""
import numpy as np
from typing import List, Union
from sentence_transformers import SentenceTransformer
from ..helpers.config import get_settings


class EmbeddingManager:
    """
    Manages embedding models using SentenceTransformer.
    Provides interface for encoding texts to embeddings.
    """
    
    def __init__(self, model_name: str = None):
        """
        Initialize the embedding manager with a SentenceTransformer model.
        
        Args:
            model_name: Optional model name. If None, uses config setting.
        """
        settings = get_settings()
        self.model_name = model_name or settings.EMBED_MODEL
        
        print(f"🤖 Initializing EmbeddingManager with model: {self.model_name}")
        self.model = SentenceTransformer(self.model_name)
        print(f"✅ EmbeddingManager ready")
    
    def embed_texts(self, texts: Union[str, List[str]], normalize: bool = False) -> np.ndarray:
        """
        Encode a text or list of texts to embeddings.
        
        Args:
            texts: Single text string or list of text strings
            normalize: Whether to normalize embeddings (L2 normalization)
            
        Returns:
            numpy array of embeddings with shape (n_texts, embedding_dim)
        """
        if isinstance(texts, str):
            texts = [texts]
        
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        
        if normalize:
            # L2 normalize each embedding
            norm = np.linalg.norm(embeddings, axis=1, keepdims=True)
            embeddings = embeddings / (norm + 1e-8)
        
        return embeddings
    
    def get_embedding_dim(self) -> int:
        """Get the embedding dimension."""
        return self.model.get_sentence_embedding_dimension()
    
    def __repr__(self):
        return f"EmbeddingManager(model='{self.model_name}', dim={self.get_embedding_dim()})"
