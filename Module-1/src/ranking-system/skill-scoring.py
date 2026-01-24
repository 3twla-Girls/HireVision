from typing import List
from CONFIG import CONFIG

# ============================================================================
# SKILL IMPORTANCE WEIGHTING
# ============================================================================
class SkillImportanceScorer:
    def __init__(self):
        self.weights = {}
        for s in CONFIG["skill_importance"]["high"]:
            self.weights[s.lower()] = 1.0
        for s in CONFIG["skill_importance"]["medium"]:
            self.weights[s.lower()] = 0.7
        for s in CONFIG["skill_importance"]["low"]:
            self.weights[s.lower()] = 0.5

    def get_weight(self, skill: str) -> float:
        return self.weights.get(skill.lower(), 0.6)

    def weighted_score(self, matched: List[str], all_skills: List[str]) -> float:
        """Returns score in 0-1 range (NOT 0-100)"""
        if not all_skills:
            return 0.0
        total_w = sum(self.get_weight(s) for s in all_skills)
        matched_w = sum(self.get_weight(s) for s in matched)
        return (matched_w / total_w) if total_w > 0 else 0.0
