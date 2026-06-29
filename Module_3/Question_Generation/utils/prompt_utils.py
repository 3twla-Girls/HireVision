# Module_3/Question_Generation/utils/prompt_utils.py
import os

class SystemPromptCache:
    cache = {}

    @staticmethod
    def load(path: str) -> str:
        # Make path relative to this file's folder
        base_dir = os.path.dirname(os.path.dirname(__file__))  # Question_Generation/
        abs_path = os.path.join(base_dir, path)

        if abs_path in SystemPromptCache.cache:
            return SystemPromptCache.cache[abs_path]

        if not os.path.exists(abs_path):
            raise FileNotFoundError(f"System prompt file not found: {abs_path}")

        with open(abs_path, "r", encoding="utf-8") as f:
            content = f.read()

        SystemPromptCache.cache[abs_path] = content
        return content