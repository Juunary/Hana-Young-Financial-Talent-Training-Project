from pydantic import BaseModel, Field


class UserProfileUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    birth_year: int | None = Field(None, ge=1950, le=2010)
    university: str | None = Field(None, max_length=200)
    major: str | None = Field(None, max_length=200)
    graduation_status: str | None = Field(
        None, pattern=r"^(enrolled|on_leave|graduated|expected)$"
    )
    employment_status: str | None = Field(
        None, pattern=r"^(student|job_seeker|employed|freelancer)$"
    )


class UserProfileResponse(BaseModel):
    name: str | None = None
    birth_year: int | None = None
    university: str | None = None
    major: str | None = None
    graduation_status: str | None = None
    employment_status: str | None = None


class UserMeResponse(BaseModel):
    id: str
    email: str
    role: str
    profile: UserProfileResponse | None = None
    has_required_consents: bool = False


class ConsentCreateRequest(BaseModel):
    consent_type: str = Field(pattern=r"^(privacy|evaluation|data_usage)$")
    consent_version: str = Field(max_length=20)
    accepted: bool


class ConsentStatusResponse(BaseModel):
    privacy: bool = False
    evaluation: bool = False
    data_usage: bool = False
