from datetime import datetime

from pydantic import BaseModel


# ── Evaluation list (admin) ──
class AdminEvaluationListItem(BaseModel):
    id: str  # public_id
    user_id: int
    user_email: str | None
    status: str
    total_score: float | None
    grade: str | None
    needs_human_review: bool
    requested_at: datetime
    completed_at: datetime | None


class AdminEvaluationListResponse(BaseModel):
    items: list[AdminEvaluationListItem]
    total: int
    page: int
    per_page: int
    total_pages: int


# ── Evaluation detail (admin) ──
class AdminFactorScore(BaseModel):
    factor_name: str
    score_value: float
    max_score: float
    reason_codes: list[str]
    explanation: str
    confidence: float


class AdminLoanEstimate(BaseModel):
    range_min: int
    range_max: int
    rationale: str
    disclaimer_text: str


class AdminReviewerNote(BaseModel):
    id: int
    reviewer_id: int
    reviewer_email: str | None
    status_change: str | None
    comment: str
    created_at: datetime


class AdminEvaluationDetail(BaseModel):
    id: str  # public_id
    user_id: int
    user_email: str | None
    status: str
    current_stage: str | None
    requested_at: datetime
    completed_at: datetime | None
    error_message: str | None
    input_snapshot_hash: str | None
    # Result fields (None if not completed)
    total_score: float | None
    grade: str | None
    confidence_level: float | None
    overall_summary: str | None
    strengths: list[str]
    improvement_areas: list[str]
    risk_flags: list[str]
    needs_human_review: bool
    factor_scores: list[AdminFactorScore]
    loan_estimate: AdminLoanEstimate | None
    # Snapshot
    snapshot_evidence: dict | None  # type: ignore[type-arg]
    snapshot_scoring_config_version: str | None
    snapshot_model_version: str | None
    # Raw AI response (admin-only)
    raw_ai_response: dict | None  # type: ignore[type-arg]
    # Reviews
    reviewer_notes: list[AdminReviewerNote]


# ── Review submission ──
class ReviewSubmitRequest(BaseModel):
    comment: str
    status_change: str | None = None
    # reviewed | needs_more_info | approved_for_demo


class ReviewSubmitResponse(BaseModel):
    id: int
    evaluation_request_id: str  # public_id
    reviewer_id: int
    status_change: str | None
    comment: str
    created_at: datetime


# ── Assignment ──
class AssignRequest(BaseModel):
    reviewer_id: int


class AssignResponse(BaseModel):
    id: int
    evaluation_request_id: str  # public_id
    reviewer_id: int
    assigned_by_id: int
    review_status: str
    assigned_at: datetime


# ── Audit log ──
class AuditLogItem(BaseModel):
    id: int
    actor_type: str
    actor_id: int | None
    event_name: str
    event_payload_json: dict | None  # type: ignore[type-arg]
    resource_type: str | None
    resource_id: str | None
    ip_address: str | None
    created_at: datetime


class AuditLogResponse(BaseModel):
    items: list[AuditLogItem]
    total: int
    page: int
    per_page: int
    total_pages: int


# ── Admin dashboard stats ──
class AdminDashboardStats(BaseModel):
    total_evaluations: int
    pending_count: int
    processing_count: int
    completed_count: int
    failed_count: int
    needs_review_count: int
    total_users: int
