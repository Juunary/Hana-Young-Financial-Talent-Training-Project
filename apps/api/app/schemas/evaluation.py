from datetime import datetime

from pydantic import BaseModel


# ── Request creation ──
class EvaluationCreateResponse(BaseModel):
    id: str  # public_id
    status: str
    requested_at: datetime

    model_config = {"from_attributes": True}


# ── Status polling ──
class StageProgress(BaseModel):
    stages: list[str]
    current_index: int
    total: int


class EvaluationStatusResponse(BaseModel):
    id: str  # public_id
    status: str
    current_stage: str | None
    stage_progress: StageProgress | None
    requested_at: datetime
    started_at: datetime | None
    completed_at: datetime | None
    error_message: str | None

    model_config = {"from_attributes": True}


# ── Factor scores ──
class FactorScoreResponse(BaseModel):
    factor_name: str
    score_value: float
    max_score: float
    reason_codes: list[str]
    explanation: str
    confidence: float

    model_config = {"from_attributes": True}


# ── Loan estimate ──
class LoanRangeEstimateResponse(BaseModel):
    range_min: int
    range_max: int
    rationale: str
    disclaimer_text: str

    model_config = {"from_attributes": True}


# ── Full result ──
class EvaluationResultResponse(BaseModel):
    id: str  # evaluation_request public_id
    status: str
    total_score: float
    grade: str
    confidence_level: float
    overall_summary: str
    strengths: list[str]
    improvement_areas: list[str]
    risk_flags: list[str]
    needs_human_review: bool
    factor_scores: list[FactorScoreResponse]
    loan_estimate: LoanRangeEstimateResponse | None
    proof_record: "ProofRecordSummary | None"
    model_version: str
    scoring_config_version: str
    processing_time_ms: int
    completed_at: datetime | None


# ── History list ──
class EvaluationHistoryItem(BaseModel):
    id: str  # public_id
    status: str
    total_score: float | None
    grade: str | None
    requested_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class EvaluationHistoryResponse(BaseModel):
    items: list[EvaluationHistoryItem]
    total: int


# ── Proof summary (embedded in result) ──
class ProofRecordSummary(BaseModel):
    id: str  # public_id
    proof_version: str
    payload_hash_sha256: str
    issuer: str
    verification_status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Proof record ──
class ProofRecordResponse(BaseModel):
    id: str  # public_id
    evaluation_result_id: int
    proof_version: str
    payload_hash_sha256: str
    evidence_combined_hash: str
    issuer: str
    verification_status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ProofVerifyResponse(BaseModel):
    valid: bool
    proof_id: str
    computed_hash: str
    stored_hash: str
    details: str
