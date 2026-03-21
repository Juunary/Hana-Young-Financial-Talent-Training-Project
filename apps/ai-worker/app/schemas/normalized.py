"""Normalized evidence schema (output of Agent A: Normalizer)."""

from pydantic import BaseModel, Field


class AcademicNorm(BaseModel):
    gpa: float
    gpa_scale: str
    gpa_normalized: float  # 0.0–1.0 (normalized to 4.5 scale)
    university: str | None
    major: str | None
    major_relevance_hint: str | None  # e.g., "CS/Engineering", "Business", "Other"


class ProjectNorm(BaseModel):
    title: str
    role: str
    tech_stack: list[str]
    duration_months: int | None
    has_outcome: bool
    complexity_hint: str  # "low" | "medium" | "high"


class InternshipNorm(BaseModel):
    company: str
    position: str
    duration_months: int | None
    relevance_hint: str  # "high" | "medium" | "low"


class CertificationNorm(BaseModel):
    name: str
    issuer: str
    level_hint: str  # "national" | "international" | "vendor" | "other"


class EducationNorm(BaseModel):
    institution: str
    course_name: str
    category: str | None


class PortfolioNorm(BaseModel):
    link_count: int
    has_github: bool
    has_blog: bool
    has_portfolio_site: bool


class GitHubNorm(BaseModel):
    username: str
    public_repos: int
    followers: int
    contributions_last_year: int | None
    repo_count: int


class NormalizedEvidence(BaseModel):
    academic: AcademicNorm | None = None
    projects: list[ProjectNorm] = Field(default_factory=list)
    internships: list[InternshipNorm] = Field(default_factory=list)
    certifications: list[CertificationNorm] = Field(default_factory=list)
    education: list[EducationNorm] = Field(default_factory=list)
    portfolio: PortfolioNorm | None = None
    github: GitHubNorm | None = None
    data_quality_flags: list[str] = Field(default_factory=list)
    completeness_score: float = Field(ge=0.0, le=1.0, default=0.0)
