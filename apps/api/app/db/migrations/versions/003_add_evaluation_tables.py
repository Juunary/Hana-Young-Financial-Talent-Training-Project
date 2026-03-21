"""add evaluation tables"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "003"
down_revision: str | None = "002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "evaluation_requests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("public_id", sa.String(36), unique=True, nullable=False, index=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column(
            "requested_at", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("celery_task_id", sa.String(100), nullable=True),
        sa.Column("current_stage", sa.String(30), nullable=True),
        sa.Column("input_snapshot_hash", sa.String(64), nullable=True),
    )

    op.create_table(
        "evaluation_input_snapshots",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "evaluation_request_id",
            sa.Integer(),
            sa.ForeignKey("evaluation_requests.id", ondelete="CASCADE"),
            unique=True,
            nullable=False,
        ),
        sa.Column("snapshot_payload", sa.JSON(), nullable=False),
        sa.Column("payload_hash_sha256", sa.String(64), nullable=False, index=True),
        sa.Column("evidence_record_ids", sa.JSON(), nullable=False),
        sa.Column("scoring_config_snapshot", sa.JSON(), nullable=False),
        sa.Column("scoring_config_version", sa.String(20), nullable=False),
        sa.Column("model_version", sa.String(100), nullable=False),
        sa.Column("prompt_version", sa.String(20), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
    )

    op.create_table(
        "evaluation_results",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "evaluation_request_id",
            sa.Integer(),
            sa.ForeignKey("evaluation_requests.id", ondelete="CASCADE"),
            unique=True,
            nullable=False,
        ),
        sa.Column("total_score", sa.Numeric(5, 2), nullable=False),
        sa.Column("grade", sa.String(5), nullable=False),
        sa.Column("confidence_level", sa.Numeric(3, 2), nullable=False, server_default="0.8"),
        sa.Column("overall_summary", sa.Text(), nullable=False),
        sa.Column("strengths", sa.JSON(), nullable=False),
        sa.Column("improvement_areas", sa.JSON(), nullable=False),
        sa.Column("risk_flags", sa.JSON(), nullable=False),
        sa.Column("needs_human_review", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("model_version", sa.String(100), nullable=False),
        sa.Column("scoring_config_version", sa.String(20), nullable=False),
        sa.Column("raw_ai_response", sa.JSON(), nullable=False),
        sa.Column("processing_time_ms", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
    )

    op.create_table(
        "evaluation_factor_scores",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "evaluation_result_id",
            sa.Integer(),
            sa.ForeignKey("evaluation_results.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("factor_name", sa.String(30), nullable=False),
        sa.Column("score_value", sa.Numeric(5, 2), nullable=False),
        sa.Column("max_score", sa.Numeric(5, 2), nullable=False),
        sa.Column("reason_codes", sa.JSON(), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=False),
        sa.Column("confidence", sa.Numeric(3, 2), nullable=False, server_default="0.8"),
        sa.Column("sub_scores", sa.JSON(), nullable=True),
    )

    op.create_table(
        "loan_range_estimates",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "evaluation_result_id",
            sa.Integer(),
            sa.ForeignKey("evaluation_results.id", ondelete="CASCADE"),
            unique=True,
            nullable=False,
        ),
        sa.Column("range_min", sa.Integer(), nullable=False),
        sa.Column("range_max", sa.Integer(), nullable=False),
        sa.Column("rationale", sa.Text(), nullable=False),
        sa.Column("disclaimer_text", sa.Text(), nullable=False),
    )

    op.create_table(
        "proof_records",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("public_id", sa.String(36), unique=True, nullable=False, index=True),
        sa.Column(
            "evaluation_result_id",
            sa.Integer(),
            sa.ForeignKey("evaluation_results.id", ondelete="CASCADE"),
            unique=True,
            nullable=False,
        ),
        sa.Column("proof_version", sa.String(20), nullable=False, server_default="1.0.0"),
        sa.Column("canonical_payload_json", sa.JSON(), nullable=False),
        sa.Column("payload_hash_sha256", sa.String(64), unique=True, nullable=False),
        sa.Column("evidence_combined_hash", sa.String(64), nullable=False),
        sa.Column(
            "issuer",
            sa.String(100),
            nullable=False,
            server_default="skill-finance-score-prototype-v1",
        ),
        sa.Column(
            "verification_status", sa.String(20), nullable=False, server_default="issued"
        ),
        sa.Column("revoked_at", sa.DateTime(), nullable=True),
        sa.Column(
            "superseded_by_id",
            sa.Integer(),
            sa.ForeignKey("proof_records.id"),
            nullable=True,
        ),
        sa.Column(
            "created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()
        ),
    )


def downgrade() -> None:
    op.drop_table("proof_records")
    op.drop_table("loan_range_estimates")
    op.drop_table("evaluation_factor_scores")
    op.drop_table("evaluation_results")
    op.drop_table("evaluation_input_snapshots")
    op.drop_table("evaluation_requests")
