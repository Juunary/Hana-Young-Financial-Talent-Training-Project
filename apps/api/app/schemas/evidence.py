from datetime import date, datetime

from pydantic import BaseModel, Field


# ── Academic ──
class AcademicRequest(BaseModel):
    gpa: float = Field(ge=0.0, le=4.5)
    gpa_scale: str = Field(pattern=r"^(4\.0|4\.3|4\.5)$")
    university: str | None = None
    major: str | None = None
    enrollment_year: int | None = Field(default=None, ge=1990, le=2030)
    is_draft: bool = True


class AcademicResponse(BaseModel):
    id: int
    gpa: float
    gpa_scale: str
    university: str | None
    major: str | None
    enrollment_year: int | None
    is_draft: bool
    created_at: datetime
    updated_at: datetime | None

    model_config = {"from_attributes": True}


# ── Project ──
class ProjectCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    role: str = Field(min_length=1, max_length=100)
    duration_months: int | None = Field(default=None, ge=1, le=120)
    start_date: date | None = None
    end_date: date | None = None
    description: str = ""
    tech_stack: list[str] = Field(default_factory=list)
    outcome_summary: str | None = None
    project_url: str | None = Field(default=None, max_length=500)
    is_draft: bool = True


class ProjectUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    role: str | None = Field(default=None, min_length=1, max_length=100)
    duration_months: int | None = Field(default=None, ge=1, le=120)
    start_date: date | None = None
    end_date: date | None = None
    description: str | None = None
    tech_stack: list[str] | None = None
    outcome_summary: str | None = None
    project_url: str | None = Field(default=None, max_length=500)
    is_draft: bool | None = None


class ProjectResponse(BaseModel):
    id: int
    title: str
    role: str
    duration_months: int | None
    start_date: date | None
    end_date: date | None
    description: str
    tech_stack: list[str]
    outcome_summary: str | None
    project_url: str | None
    is_draft: bool
    created_at: datetime
    updated_at: datetime | None

    model_config = {"from_attributes": True}


# ── Internship ──
class InternshipCreateRequest(BaseModel):
    company: str = Field(min_length=1, max_length=200)
    position: str = Field(min_length=1, max_length=200)
    department: str | None = Field(default=None, max_length=200)
    start_date: date | None = None
    end_date: date | None = None
    duration_months: int | None = Field(default=None, ge=1, le=120)
    description: str = ""
    is_draft: bool = True


class InternshipUpdateRequest(BaseModel):
    company: str | None = Field(default=None, min_length=1, max_length=200)
    position: str | None = Field(default=None, min_length=1, max_length=200)
    department: str | None = Field(default=None, max_length=200)
    start_date: date | None = None
    end_date: date | None = None
    duration_months: int | None = Field(default=None, ge=1, le=120)
    description: str | None = None
    is_draft: bool | None = None


class InternshipResponse(BaseModel):
    id: int
    company: str
    position: str
    department: str | None
    start_date: date | None
    end_date: date | None
    duration_months: int | None
    description: str
    is_draft: bool
    created_at: datetime
    updated_at: datetime | None

    model_config = {"from_attributes": True}


# ── Certification ──
class CertificationCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    issuer: str = Field(min_length=1, max_length=200)
    issued_date: date | None = None
    expiry_date: date | None = None
    credential_id: str | None = Field(default=None, max_length=200)
    credential_url: str | None = Field(default=None, max_length=500)
    is_draft: bool = True


class CertificationUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    issuer: str | None = Field(default=None, min_length=1, max_length=200)
    issued_date: date | None = None
    expiry_date: date | None = None
    credential_id: str | None = Field(default=None, max_length=200)
    credential_url: str | None = Field(default=None, max_length=500)
    is_draft: bool | None = None


class CertificationResponse(BaseModel):
    id: int
    name: str
    issuer: str
    issued_date: date | None
    expiry_date: date | None
    credential_id: str | None
    credential_url: str | None
    is_draft: bool
    created_at: datetime
    updated_at: datetime | None

    model_config = {"from_attributes": True}


# ── Education ──
class EducationCreateRequest(BaseModel):
    institution: str = Field(min_length=1, max_length=200)
    course_name: str = Field(min_length=1, max_length=200)
    category: str | None = Field(default=None, max_length=50)
    start_date: date | None = None
    end_date: date | None = None
    description: str | None = None
    certificate_url: str | None = Field(default=None, max_length=500)
    is_draft: bool = True


class EducationUpdateRequest(BaseModel):
    institution: str | None = Field(default=None, min_length=1, max_length=200)
    course_name: str | None = Field(default=None, min_length=1, max_length=200)
    category: str | None = Field(default=None, max_length=50)
    start_date: date | None = None
    end_date: date | None = None
    description: str | None = None
    certificate_url: str | None = Field(default=None, max_length=500)
    is_draft: bool | None = None


class EducationResponse(BaseModel):
    id: int
    institution: str
    course_name: str
    category: str | None
    start_date: date | None
    end_date: date | None
    description: str | None
    certificate_url: str | None
    is_draft: bool
    created_at: datetime
    updated_at: datetime | None

    model_config = {"from_attributes": True}


# ── Portfolio ──
class PortfolioLinkItem(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    url: str = Field(min_length=1, max_length=500)
    description: str | None = None
    link_type: str | None = Field(default=None, max_length=50)


class PortfolioSaveRequest(BaseModel):
    links: list[PortfolioLinkItem] = Field(max_length=20)


class PortfolioLinkResponse(BaseModel):
    id: int
    title: str
    url: str
    description: str | None
    link_type: str | None
    created_at: datetime
    updated_at: datetime | None

    model_config = {"from_attributes": True}


# ── GitHub ──
class GitHubProfileRequest(BaseModel):
    username: str = Field(min_length=1, max_length=100)


class GitHubRepoSnapshotResponse(BaseModel):
    id: int
    repo_name: str
    repo_url: str
    description: str | None
    stars: int
    forks: int
    primary_language: str | None
    commit_count_snapshot: int
    last_activity_at: datetime | None
    snapshot_at: datetime

    model_config = {"from_attributes": True}


class GitHubProfileResponse(BaseModel):
    id: int
    username: str
    profile_url: str
    public_repos: int
    followers: int
    following: int
    contributions_last_year: int | None
    bio: str | None
    fetched_at: datetime | None
    repo_snapshots: list[GitHubRepoSnapshotResponse]
    created_at: datetime
    updated_at: datetime | None

    model_config = {"from_attributes": True}


# ── Upload ──
class UploadPresignRequest(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    content_type: str = Field(min_length=1, max_length=100)


class UploadPresignResponse(BaseModel):
    file_id: int
    upload_url: str


class UploadCompleteRequest(BaseModel):
    file_id: int


class UploadedFileResponse(BaseModel):
    id: int
    original_filename: str
    file_size: int
    mime_type: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Summary ──
class EvidenceCategoryStatus(BaseModel):
    category: str
    display_name: str
    count: int
    has_data: bool


class EvidenceSummaryResponse(BaseModel):
    categories: list[EvidenceCategoryStatus]
    total_categories_with_data: int
    total_categories: int
