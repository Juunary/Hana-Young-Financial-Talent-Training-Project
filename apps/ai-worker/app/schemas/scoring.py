"""Scoring result schema (output of Agent B: Scorer)."""

from pydantic import BaseModel, Field


class FactorScore(BaseModel):
    factor_name: str
    score_value: float = Field(ge=0.0)
    max_score: float = Field(gt=0.0)
    reason_codes: list[str] = Field(default_factory=list)
    explanation: str
    confidence: float = Field(ge=0.0, le=1.0, default=0.8)


class ScoringResult(BaseModel):
    total_score: float = Field(ge=0.0, le=100.0)
    grade: str  # S | A+ | A | B+ | B | C+ | C | D
    factor_scores: list[FactorScore]
    risk_flags: list[str] = Field(default_factory=list)
    needs_human_review: bool = False
    reviewer_flags: list[str] = Field(default_factory=list)
