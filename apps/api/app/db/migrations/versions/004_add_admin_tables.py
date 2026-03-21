"""add admin tables: evaluation_assignments, reviewer_notes"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "004"
down_revision: str | None = "003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "evaluation_assignments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "evaluation_request_id",
            sa.Integer(),
            sa.ForeignKey("evaluation_requests.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "reviewer_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "assigned_by_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("review_status", sa.String(30), nullable=False, default="assigned"),
        sa.Column(
            "assigned_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint(
            "evaluation_request_id",
            "reviewer_id",
            name="uq_assignment_eval_reviewer",
        ),
    )

    op.create_table(
        "reviewer_notes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "evaluation_request_id",
            sa.Integer(),
            sa.ForeignKey("evaluation_requests.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "reviewer_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "assignment_id",
            sa.Integer(),
            sa.ForeignKey("evaluation_assignments.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("status_change", sa.String(30), nullable=True),
        sa.Column("comment", sa.Text(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False
        ),
    )


def downgrade() -> None:
    op.drop_table("reviewer_notes")
    op.drop_table("evaluation_assignments")
