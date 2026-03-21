import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy import JSON, ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


def _uuid4() -> str:
    return str(uuid.uuid4())


class EvaluationRequest(Base):
    __tablename__ = "evaluation_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    public_id: Mapped[str] = mapped_column(
        String(36), unique=True, index=True, default=_uuid4
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[str] = mapped_column(String(20), default="pending")
    # pending | processing | completed | failed
    requested_at: Mapped[datetime] = mapped_column(server_default=sa.func.now())
    started_at: Mapped[datetime | None]
    completed_at: Mapped[datetime | None]
    error_message: Mapped[str | None] = mapped_column(Text)
    celery_task_id: Mapped[str | None] = mapped_column(String(100))
    current_stage: Mapped[str | None] = mapped_column(String(30))
    # normalizing | scoring | explaining | saving
    input_snapshot_hash: Mapped[str | None] = mapped_column(String(64))

    # Relationships
    input_snapshot: Mapped["EvaluationInputSnapshot | None"] = relationship(
        back_populates="evaluation_request", cascade="all, delete-orphan"
    )
    result: Mapped["EvaluationResult | None"] = relationship(
        back_populates="evaluation_request", cascade="all, delete-orphan"
    )


class EvaluationInputSnapshot(Base):
    __tablename__ = "evaluation_input_snapshots"

    id: Mapped[int] = mapped_column(primary_key=True)
    evaluation_request_id: Mapped[int] = mapped_column(
        ForeignKey("evaluation_requests.id", ondelete="CASCADE"), unique=True
    )
    snapshot_payload: Mapped[dict] = mapped_column(JSON)  # type: ignore[type-arg]
    payload_hash_sha256: Mapped[str] = mapped_column(String(64), index=True)
    evidence_record_ids: Mapped[dict] = mapped_column(JSON)  # type: ignore[type-arg]
    scoring_config_snapshot: Mapped[dict] = mapped_column(JSON)  # type: ignore[type-arg]
    scoring_config_version: Mapped[str] = mapped_column(String(20))
    model_version: Mapped[str] = mapped_column(String(100))
    prompt_version: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(server_default=sa.func.now())

    evaluation_request: Mapped["EvaluationRequest"] = relationship(
        back_populates="input_snapshot"
    )


class EvaluationResult(Base):
    __tablename__ = "evaluation_results"

    id: Mapped[int] = mapped_column(primary_key=True)
    evaluation_request_id: Mapped[int] = mapped_column(
        ForeignKey("evaluation_requests.id", ondelete="CASCADE"), unique=True
    )
    total_score: Mapped[float] = mapped_column(Numeric(5, 2))
    grade: Mapped[str] = mapped_column(String(5))
    confidence_level: Mapped[float] = mapped_column(Numeric(3, 2), default=0.8)
    overall_summary: Mapped[str] = mapped_column(Text)
    strengths: Mapped[list] = mapped_column(JSON)  # type: ignore[type-arg]
    improvement_areas: Mapped[list] = mapped_column(JSON)  # type: ignore[type-arg]
    risk_flags: Mapped[list] = mapped_column(JSON)  # type: ignore[type-arg]
    needs_human_review: Mapped[bool] = mapped_column(default=False)
    model_version: Mapped[str] = mapped_column(String(100))
    scoring_config_version: Mapped[str] = mapped_column(String(20))
    raw_ai_response: Mapped[dict] = mapped_column(JSON)  # type: ignore[type-arg]
    processing_time_ms: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(server_default=sa.func.now())

    evaluation_request: Mapped["EvaluationRequest"] = relationship(
        back_populates="result"
    )
    factor_scores: Mapped[list["EvaluationFactorScore"]] = relationship(
        back_populates="evaluation_result", cascade="all, delete-orphan"
    )
    loan_estimate: Mapped["LoanRangeEstimate | None"] = relationship(
        back_populates="evaluation_result", cascade="all, delete-orphan"
    )
    proof_record: Mapped["ProofRecord | None"] = relationship(
        back_populates="evaluation_result", cascade="all, delete-orphan"
    )


class EvaluationFactorScore(Base):
    __tablename__ = "evaluation_factor_scores"

    id: Mapped[int] = mapped_column(primary_key=True)
    evaluation_result_id: Mapped[int] = mapped_column(
        ForeignKey("evaluation_results.id", ondelete="CASCADE"), index=True
    )
    factor_name: Mapped[str] = mapped_column(String(30))
    score_value: Mapped[float] = mapped_column(Numeric(5, 2))
    max_score: Mapped[float] = mapped_column(Numeric(5, 2))
    reason_codes: Mapped[list] = mapped_column(JSON)  # type: ignore[type-arg]
    explanation: Mapped[str] = mapped_column(Text)
    confidence: Mapped[float] = mapped_column(Numeric(3, 2), default=0.8)
    sub_scores: Mapped[dict | None] = mapped_column(JSON)  # type: ignore[type-arg]

    evaluation_result: Mapped["EvaluationResult"] = relationship(
        back_populates="factor_scores"
    )


class LoanRangeEstimate(Base):
    __tablename__ = "loan_range_estimates"

    id: Mapped[int] = mapped_column(primary_key=True)
    evaluation_result_id: Mapped[int] = mapped_column(
        ForeignKey("evaluation_results.id", ondelete="CASCADE"), unique=True
    )
    range_min: Mapped[int]
    range_max: Mapped[int]
    rationale: Mapped[str] = mapped_column(Text)
    disclaimer_text: Mapped[str] = mapped_column(Text)

    evaluation_result: Mapped["EvaluationResult"] = relationship(
        back_populates="loan_estimate"
    )


class ProofRecord(Base):
    __tablename__ = "proof_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    public_id: Mapped[str] = mapped_column(
        String(36), unique=True, index=True, default=_uuid4
    )
    evaluation_result_id: Mapped[int] = mapped_column(
        ForeignKey("evaluation_results.id", ondelete="CASCADE"), unique=True
    )
    proof_version: Mapped[str] = mapped_column(String(20), default="1.0.0")
    canonical_payload_json: Mapped[dict] = mapped_column(JSON)  # type: ignore[type-arg]
    payload_hash_sha256: Mapped[str] = mapped_column(String(64), unique=True)
    evidence_combined_hash: Mapped[str] = mapped_column(String(64))
    issuer: Mapped[str] = mapped_column(
        String(100), default="skill-finance-score-prototype-v1"
    )
    verification_status: Mapped[str] = mapped_column(String(20), default="issued")
    revoked_at: Mapped[datetime | None]
    superseded_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("proof_records.id")
    )
    created_at: Mapped[datetime] = mapped_column(server_default=sa.func.now())

    evaluation_result: Mapped["EvaluationResult"] = relationship(
        back_populates="proof_record"
    )


class EvaluationAssignment(Base):
    """Reviewer assignment: admin assigns a reviewer to an evaluation request."""

    __tablename__ = "evaluation_assignments"
    __table_args__ = (
        UniqueConstraint(
            "evaluation_request_id", "reviewer_id", name="uq_assignment_eval_reviewer"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    evaluation_request_id: Mapped[int] = mapped_column(
        ForeignKey("evaluation_requests.id", ondelete="CASCADE"), index=True
    )
    reviewer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    assigned_by_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    review_status: Mapped[str] = mapped_column(String(30), default="assigned")
    # assigned | in_review | reviewed | needs_more_info | approved_for_demo | reassigned
    assigned_at: Mapped[datetime] = mapped_column(server_default=sa.func.now())
    completed_at: Mapped[datetime | None]


class ReviewerNote(Base):
    """Review comments left by an admin or reviewer on an evaluation."""

    __tablename__ = "reviewer_notes"

    id: Mapped[int] = mapped_column(primary_key=True)
    evaluation_request_id: Mapped[int] = mapped_column(
        ForeignKey("evaluation_requests.id", ondelete="CASCADE"), index=True
    )
    reviewer_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    assignment_id: Mapped[int | None] = mapped_column(
        ForeignKey("evaluation_assignments.id", ondelete="SET NULL")
    )
    status_change: Mapped[str | None] = mapped_column(String(30))
    comment: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(server_default=sa.func.now())
