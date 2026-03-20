import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.evidence import (
    AcademicRecord,
    CertificationRecord,
    EducationRecord,
    GitHubProfile,
    InternshipRecord,
    PortfolioLink,
    ProjectRecord,
    UploadedFile,
)
from app.models.user import User
from app.repositories import evidence_repo
from app.schemas.evidence import (
    AcademicRequest,
    AcademicResponse,
    CertificationCreateRequest,
    CertificationResponse,
    CertificationUpdateRequest,
    EducationCreateRequest,
    EducationResponse,
    EducationUpdateRequest,
    EvidenceCategoryStatus,
    EvidenceSummaryResponse,
    GitHubProfileRequest,
    GitHubProfileResponse,
    InternshipCreateRequest,
    InternshipResponse,
    InternshipUpdateRequest,
    PortfolioLinkResponse,
    PortfolioSaveRequest,
    ProjectCreateRequest,
    ProjectResponse,
    ProjectUpdateRequest,
    UploadedFileResponse,
    UploadPresignRequest,
    UploadPresignResponse,
)

router = APIRouter(prefix="/api/v1/evidence", tags=["evidence"])
upload_router = APIRouter(prefix="/api/v1/uploads", tags=["uploads"])


# ── Summary ──
@router.get("/summary", response_model=EvidenceSummaryResponse)
async def get_evidence_summary(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EvidenceSummaryResponse:
    categories_config: list[tuple[str, str, type[object]]] = [
        ("academic", "학업 기록", AcademicRecord),
        ("projects", "프로젝트", ProjectRecord),
        ("internships", "인턴십/대외활동", InternshipRecord),
        ("certifications", "자격증", CertificationRecord),
        ("education", "교육 이수", EducationRecord),
        ("portfolio", "포트폴리오", PortfolioLink),
        ("github", "GitHub", GitHubProfile),
        ("uploads", "파일 업로드", UploadedFile),
    ]

    categories = []
    for key, display, model in categories_config:
        count = await evidence_repo.count_by_user(db, model, user.id)
        categories.append(
            EvidenceCategoryStatus(
                category=key,
                display_name=display,
                count=count,
                has_data=count > 0,
            )
        )

    total_with_data = sum(1 for c in categories if c.has_data)
    return EvidenceSummaryResponse(
        categories=categories,
        total_categories_with_data=total_with_data,
        total_categories=len(categories),
    )


# ── Academic (single record, PUT to upsert) ──
@router.get("/academic", response_model=AcademicResponse | None)
async def get_academic(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AcademicResponse | None:
    record = await evidence_repo.get_academic(db, user.id)
    if record is None:
        return None
    return AcademicResponse.model_validate(record)


@router.put("/academic", response_model=AcademicResponse)
async def save_academic(
    body: AcademicRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AcademicResponse:
    record = await evidence_repo.upsert_academic(
        db, user.id, body.model_dump()
    )
    await db.commit()
    return AcademicResponse.model_validate(record)


# ── Projects (CRUD) ──
@router.get("/projects", response_model=list[ProjectResponse])
async def list_projects(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ProjectResponse]:
    records = await evidence_repo.list_projects(db, user.id)
    return [ProjectResponse.model_validate(r) for r in records]


@router.post("/projects", response_model=ProjectResponse, status_code=201)
async def create_project(
    body: ProjectCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    record = await evidence_repo.create_project(db, user.id, body.model_dump())
    await db.commit()
    return ProjectResponse.model_validate(record)


@router.put("/projects/{record_id}", response_model=ProjectResponse)
async def update_project(
    record_id: int,
    body: ProjectUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    record = await evidence_repo.get_project(db, record_id, user.id)
    if record is None:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")
    await evidence_repo.update_project(record, body.model_dump(exclude_unset=True))
    await db.commit()
    return ProjectResponse.model_validate(record)


@router.delete("/projects/{record_id}", status_code=204)
async def delete_project(
    record_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    record = await evidence_repo.get_project(db, record_id, user.id)
    if record is None:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")
    await evidence_repo.delete_project(db, record)
    await db.commit()


# ── Internships (CRUD) ──
@router.get("/internships", response_model=list[InternshipResponse])
async def list_internships(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[InternshipResponse]:
    records = await evidence_repo.list_internships(db, user.id)
    return [InternshipResponse.model_validate(r) for r in records]


@router.post("/internships", response_model=InternshipResponse, status_code=201)
async def create_internship(
    body: InternshipCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InternshipResponse:
    record = await evidence_repo.create_internship(db, user.id, body.model_dump())
    await db.commit()
    return InternshipResponse.model_validate(record)


@router.put("/internships/{record_id}", response_model=InternshipResponse)
async def update_internship(
    record_id: int,
    body: InternshipUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InternshipResponse:
    record = await evidence_repo.get_internship(db, record_id, user.id)
    if record is None:
        raise HTTPException(status_code=404, detail="인턴십 기록을 찾을 수 없습니다.")
    await evidence_repo.update_internship(record, body.model_dump(exclude_unset=True))
    await db.commit()
    return InternshipResponse.model_validate(record)


@router.delete("/internships/{record_id}", status_code=204)
async def delete_internship(
    record_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    record = await evidence_repo.get_internship(db, record_id, user.id)
    if record is None:
        raise HTTPException(status_code=404, detail="인턴십 기록을 찾을 수 없습니다.")
    await evidence_repo.delete_internship(db, record)
    await db.commit()


# ── Certifications (CRUD) ──
@router.get("/certifications", response_model=list[CertificationResponse])
async def list_certifications(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[CertificationResponse]:
    records = await evidence_repo.list_certifications(db, user.id)
    return [CertificationResponse.model_validate(r) for r in records]


@router.post("/certifications", response_model=CertificationResponse, status_code=201)
async def create_certification(
    body: CertificationCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CertificationResponse:
    record = await evidence_repo.create_certification(db, user.id, body.model_dump())
    await db.commit()
    return CertificationResponse.model_validate(record)


@router.put("/certifications/{record_id}", response_model=CertificationResponse)
async def update_certification(
    record_id: int,
    body: CertificationUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CertificationResponse:
    record = await evidence_repo.get_certification(db, record_id, user.id)
    if record is None:
        raise HTTPException(status_code=404, detail="자격증을 찾을 수 없습니다.")
    await evidence_repo.update_certification(record, body.model_dump(exclude_unset=True))
    await db.commit()
    return CertificationResponse.model_validate(record)


@router.delete("/certifications/{record_id}", status_code=204)
async def delete_certification(
    record_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    record = await evidence_repo.get_certification(db, record_id, user.id)
    if record is None:
        raise HTTPException(status_code=404, detail="자격증을 찾을 수 없습니다.")
    await evidence_repo.delete_certification(db, record)
    await db.commit()


# ── Education (CRUD) ──
@router.get("/education", response_model=list[EducationResponse])
async def list_education(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[EducationResponse]:
    records = await evidence_repo.list_education(db, user.id)
    return [EducationResponse.model_validate(r) for r in records]


@router.post("/education", response_model=EducationResponse, status_code=201)
async def create_education(
    body: EducationCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EducationResponse:
    record = await evidence_repo.create_education(db, user.id, body.model_dump())
    await db.commit()
    return EducationResponse.model_validate(record)


@router.put("/education/{record_id}", response_model=EducationResponse)
async def update_education(
    record_id: int,
    body: EducationUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EducationResponse:
    record = await evidence_repo.get_education(db, record_id, user.id)
    if record is None:
        raise HTTPException(status_code=404, detail="교육 이수 기록을 찾을 수 없습니다.")
    await evidence_repo.update_education(record, body.model_dump(exclude_unset=True))
    await db.commit()
    return EducationResponse.model_validate(record)


@router.delete("/education/{record_id}", status_code=204)
async def delete_education(
    record_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    record = await evidence_repo.get_education(db, record_id, user.id)
    if record is None:
        raise HTTPException(status_code=404, detail="교육 이수 기록을 찾을 수 없습니다.")
    await evidence_repo.delete_education(db, record)
    await db.commit()


# ── Portfolio (bulk replace) ──
@router.get("/portfolio", response_model=list[PortfolioLinkResponse])
async def get_portfolio(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[PortfolioLinkResponse]:
    records = await evidence_repo.list_portfolio(db, user.id)
    return [PortfolioLinkResponse.model_validate(r) for r in records]


@router.put("/portfolio", response_model=list[PortfolioLinkResponse])
async def save_portfolio(
    body: PortfolioSaveRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[PortfolioLinkResponse]:
    link_dicts: list[dict[str, object]] = [link.model_dump() for link in body.links]
    records = await evidence_repo.replace_portfolio(db, user.id, link_dicts)
    await db.commit()
    return [PortfolioLinkResponse.model_validate(r) for r in records]


# ── GitHub ──
@router.get("/github", response_model=GitHubProfileResponse | None)
async def get_github(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GitHubProfileResponse | None:
    record = await evidence_repo.get_github_profile(db, user.id)
    if record is None:
        return None
    return GitHubProfileResponse.model_validate(record)


@router.put("/github", response_model=GitHubProfileResponse)
async def save_github(
    body: GitHubProfileRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GitHubProfileResponse:
    data: dict[str, object] = {
        "username": body.username,
        "profile_url": f"https://github.com/{body.username}",
    }
    # TODO: Fetch GitHub API data in background task
    record = await evidence_repo.upsert_github_profile(db, user.id, data)
    await db.commit()
    return GitHubProfileResponse.model_validate(record)


# ── Uploads ──
@upload_router.get("", response_model=list[UploadedFileResponse])
async def list_uploads(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[UploadedFileResponse]:
    records = await evidence_repo.list_uploads(db, user.id)
    return [UploadedFileResponse.model_validate(r) for r in records]


@upload_router.post("/presign", response_model=UploadPresignResponse, status_code=201)
async def presign_upload(
    body: UploadPresignRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UploadPresignResponse:
    allowed_types = {
        "application/pdf",
        "image/jpeg",
        "image/png",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }
    if body.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"허용되지 않는 파일 형식입니다. 허용: {', '.join(allowed_types)}",
        )

    file_key = f"uploads/{user.id}/{uuid.uuid4()}/{body.filename}"
    record = await evidence_repo.create_upload(
        db,
        user.id,
        {
            "original_filename": body.filename,
            "file_key": file_key,
            "file_size": 0,
            "mime_type": body.content_type,
        },
    )
    await db.commit()

    # TODO: Generate actual S3 presigned URL
    upload_url = f"/mock-upload/{file_key}"

    return UploadPresignResponse(file_id=record.id, upload_url=upload_url)


@upload_router.delete("/{file_id}", status_code=204)
async def delete_upload(
    file_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    record = await evidence_repo.get_upload(db, file_id, user.id)
    if record is None:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
    await evidence_repo.soft_delete_upload(record)
    await db.commit()
