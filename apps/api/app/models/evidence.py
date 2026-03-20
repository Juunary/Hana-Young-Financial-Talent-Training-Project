from datetime import date, datetime

from sqlalchemy import JSON, Date, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class AcademicRecord(Base):
    __tablename__ = "academic_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    gpa: Mapped[float] = mapped_column(Float)
    gpa_scale: Mapped[str] = mapped_column(String(5))  # "4.0", "4.3", "4.5"
    university: Mapped[str | None] = mapped_column(String(200))
    major: Mapped[str | None] = mapped_column(String(200))
    enrollment_year: Mapped[int | None] = mapped_column(Integer)
    is_draft: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(onupdate=func.now())


class ProjectRecord(Base):
    __tablename__ = "project_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    role: Mapped[str] = mapped_column(String(100))
    duration_months: Mapped[int | None] = mapped_column(Integer)
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    description: Mapped[str] = mapped_column(Text, default="")
    tech_stack: Mapped[list[object] | None] = mapped_column(JSON, default=list)
    outcome_summary: Mapped[str | None] = mapped_column(Text)
    project_url: Mapped[str | None] = mapped_column(String(500))
    is_draft: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(onupdate=func.now())


class InternshipRecord(Base):
    __tablename__ = "internship_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    company: Mapped[str] = mapped_column(String(200))
    position: Mapped[str] = mapped_column(String(200))
    department: Mapped[str | None] = mapped_column(String(200))
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    duration_months: Mapped[int | None] = mapped_column(Integer)
    description: Mapped[str] = mapped_column(Text, default="")
    is_draft: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(onupdate=func.now())


class CertificationRecord(Base):
    __tablename__ = "certification_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(200))
    issuer: Mapped[str] = mapped_column(String(200))
    issued_date: Mapped[date | None] = mapped_column(Date)
    expiry_date: Mapped[date | None] = mapped_column(Date)
    credential_id: Mapped[str | None] = mapped_column(String(200))
    credential_url: Mapped[str | None] = mapped_column(String(500))
    is_draft: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(onupdate=func.now())


class EducationRecord(Base):
    __tablename__ = "education_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    institution: Mapped[str] = mapped_column(String(200))
    course_name: Mapped[str] = mapped_column(String(200))
    category: Mapped[str | None] = mapped_column(String(50))  # online, bootcamp, workshop, seminar
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    description: Mapped[str | None] = mapped_column(Text)
    certificate_url: Mapped[str | None] = mapped_column(String(500))
    is_draft: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(onupdate=func.now())


class PortfolioLink(Base):
    __tablename__ = "portfolio_links"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    url: Mapped[str] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(Text)
    link_type: Mapped[str | None] = mapped_column(String(50))  # website, blog, behance, other
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(onupdate=func.now())


class GitHubProfile(Base):
    __tablename__ = "github_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(100))
    profile_url: Mapped[str] = mapped_column(String(500))
    public_repos: Mapped[int] = mapped_column(default=0)
    followers: Mapped[int] = mapped_column(default=0)
    following: Mapped[int] = mapped_column(default=0)
    contributions_last_year: Mapped[int | None] = mapped_column(Integer)
    bio: Mapped[str | None] = mapped_column(Text)
    fetched_at: Mapped[datetime | None]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(onupdate=func.now())

    repo_snapshots: Mapped[list["GitHubRepoSnapshot"]] = relationship(
        back_populates="github_profile", lazy="selectin", cascade="all, delete-orphan"
    )


class GitHubRepoSnapshot(Base):
    __tablename__ = "github_repo_snapshots"

    id: Mapped[int] = mapped_column(primary_key=True)
    github_profile_id: Mapped[int] = mapped_column(
        ForeignKey("github_profiles.id"), index=True
    )
    repo_name: Mapped[str] = mapped_column(String(200))
    repo_url: Mapped[str] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(Text)
    stars: Mapped[int] = mapped_column(default=0)
    forks: Mapped[int] = mapped_column(default=0)
    primary_language: Mapped[str | None] = mapped_column(String(50))
    commit_count_snapshot: Mapped[int] = mapped_column(default=0)
    last_activity_at: Mapped[datetime | None]
    snapshot_at: Mapped[datetime] = mapped_column(server_default=func.now())

    github_profile: Mapped["GitHubProfile"] = relationship(back_populates="repo_snapshots")


class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    original_filename: Mapped[str] = mapped_column(String(255))
    file_key: Mapped[str] = mapped_column(String(500))  # S3 object key
    file_size: Mapped[int] = mapped_column(Integer)
    mime_type: Mapped[str] = mapped_column(String(100))
    sha256_hash: Mapped[str | None] = mapped_column(String(64))
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
