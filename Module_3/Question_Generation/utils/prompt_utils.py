from pathlib import Path

class SystemPromptCache:
    """
    Singleton cache for system prompts.
    Loads a prompt from file once and caches it in memory.
    Supports multiple prompts.
    """
    _cache = {}

    @classmethod
    def load(cls, path: str) -> str:
        """
        Load a system prompt from a file and cache it.
        If already cached, return the cached prompt.

        Args:
            path (str): Path to the prompt file

        Returns:
            str: The prompt text
        """
        path_obj = Path(path)
        if not path_obj.exists():
            raise FileNotFoundError(f"System prompt file not found: {path}")

        if path not in cls._cache:
            with open(path, "r", encoding="utf-8") as f:
                cls._cache[path] = f.read()

        return cls._cache[path]

