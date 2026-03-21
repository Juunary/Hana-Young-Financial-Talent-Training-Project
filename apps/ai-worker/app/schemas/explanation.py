"""Evaluation explanation schema (output of Agent C: Explainer)."""

from pydantic import BaseModel, Field


class LoanRangeEstimate(BaseModel):
    min_amount: int
    max_amount: int
    rationale: str
    disclaimer: str = (
        "본 결과는 프로토타입 시뮬레이션이며, "
        "실제 금융기관의 대출 심사와 무관합니다."
    )


class FactorExplanation(BaseModel):
    factor_name: str
    summary: str
    key_points: list[str] = Field(default_factory=list)


class EvaluationExplanation(BaseModel):
    overall_summary: str
    factor_explanations: list[FactorExplanation] = Field(default_factory=list)
    strengths: list[str] = Field(min_length=1, max_length=5)
    improvement_areas: list[str] = Field(min_length=1, max_length=5)
    loan_estimate: LoanRangeEstimate
    follow_up_recommendations: list[str] = Field(default_factory=list)
