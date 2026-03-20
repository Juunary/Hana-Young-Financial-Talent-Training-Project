"""add evidence tables

Revision ID: 002
Revises: 001
Create Date: 2026-03-20
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: str | None = "001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "academic_records",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id", sa.Integer(), sa.ForeignKey("users.id"), unique=True, nullable=False
        ),
        sa.Column("gpa", sa.Float(), nullable=False),
        sa.Column("gpa_scale", sa.String(5), nullable=False),
        sa.Column("university", sa.String(200), nullable=True),
        sa.Column("major", sa.String(200), nullable=True),
        sa.Column("enrollment_year", sa.Integer(), nullable=True),
        sa.Column("is_draft", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_academic_records_user_id", "academic_records", ["user_id"])

    op.create_table(
        "project_records",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("role", sa.String(100), nullable=False),
        sa.Column("duration_months", sa.Integer(), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("tech_stack", sa.JSON(), nullable=True),
        sa.Column("outcome_summary", sa.Text(), nullable=True),
        sa.Column("project_url", sa.String(500), nullable=True),
        sa.Column("is_draft", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_project_records_user_id", "project_records", ["user_id"])

    op.create_table(
        "internship_records",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("company", sa.String(200), nullable=False),
        sa.Column("position", sa.String(200), nullable=False),
        sa.Column("department", sa.String(200), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("duration_months", sa.Integer(), nullable=True),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("is_draft", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_internship_records_user_id", "internship_records", ["user_id"])

    op.create_table(
        "certification_records",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("issuer", sa.String(200), nullable=False),
        sa.Column("issued_date", sa.Date(), nullable=True),
        sa.Column("expiry_date", sa.Date(), nullable=True),
        sa.Column("credential_id", sa.String(200), nullable=True),
        sa.Column("credential_url", sa.String(500), nullable=True),
        sa.Column("is_draft", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_certification_records_user_id", "certification_records", ["user_id"])

    op.create_table(
        "education_records",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("institution", sa.String(200), nullable=False),
        sa.Column("course_name", sa.String(200), nullable=False),
        sa.Column("category", sa.String(50), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("certificate_url", sa.String(500), nullable=True),
        sa.Column("is_draft", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_education_records_user_id", "education_records", ["user_id"])

    op.create_table(
        "portfolio_links",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("url", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("link_type", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_portfolio_links_user_id", "portfolio_links", ["user_id"])

    op.create_table(
        "github_profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id", sa.Integer(), sa.ForeignKey("users.id"), unique=True, nullable=False
        ),
        sa.Column("username", sa.String(100), nullable=False),
        sa.Column("profile_url", sa.String(500), nullable=False),
        sa.Column("public_repos", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("followers", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("following", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("contributions_last_year", sa.Integer(), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("fetched_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_github_profiles_user_id", "github_profiles", ["user_id"])

    op.create_table(
        "github_repo_snapshots",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "github_profile_id",
            sa.Integer(),
            sa.ForeignKey("github_profiles.id"),
            nullable=False,
        ),
        sa.Column("repo_name", sa.String(200), nullable=False),
        sa.Column("repo_url", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("stars", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("forks", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("primary_language", sa.String(50), nullable=True),
        sa.Column("commit_count_snapshot", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_activity_at", sa.DateTime(), nullable=True),
        sa.Column("snapshot_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index(
        "ix_github_repo_snapshots_profile_id", "github_repo_snapshots", ["github_profile_id"]
    )

    op.create_table(
        "uploaded_files",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("original_filename", sa.String(255), nullable=False),
        sa.Column("file_key", sa.String(500), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("mime_type", sa.String(100), nullable=False),
        sa.Column("sha256_hash", sa.String(64), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_uploaded_files_user_id", "uploaded_files", ["user_id"])


def downgrade() -> None:
    op.drop_table("uploaded_files")
    op.drop_table("github_repo_snapshots")
    op.drop_table("github_profiles")
    op.drop_table("portfolio_links")
    op.drop_table("education_records")
    op.drop_table("certification_records")
    op.drop_table("internship_records")
    op.drop_table("project_records")
    op.drop_table("academic_records")
