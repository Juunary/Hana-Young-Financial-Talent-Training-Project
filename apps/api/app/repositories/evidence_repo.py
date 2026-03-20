from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

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


# ── Academic (single per user) ──
async def get_academic(db: AsyncSession, user_id: int) -> AcademicRecord | None:
    result = await db.execute(
        select(AcademicRecord).where(AcademicRecord.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def upsert_academic(
    db: AsyncSession, user_id: int, data: dict[str, object]
) -> AcademicRecord:
    existing = await get_academic(db, user_id)
    if existing:
        for key, value in data.items():
            setattr(existing, key, value)
        await db.flush()
        return existing
    record = AcademicRecord(user_id=user_id, **data)
    db.add(record)
    await db.flush()
    return record


# ── Generic multi-record helpers ──
async def _list_by_user(
    db: AsyncSession, model: type, user_id: int  # type: ignore[type-arg]
) -> list[object]:
    result = await db.execute(
        select(model).where(model.user_id == user_id).order_by(model.id.asc())
    )
    return list(result.scalars().all())


async def _get_owned(
    db: AsyncSession, model: type, record_id: int, user_id: int  # type: ignore[type-arg]
) -> object | None:
    result = await db.execute(
        select(model).where(model.id == record_id, model.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def _create_record(
    db: AsyncSession, model: type, user_id: int, data: dict[str, object]  # type: ignore[type-arg]
) -> object:
    record = model(user_id=user_id, **data)
    db.add(record)
    await db.flush()
    return record


async def _update_record(record: object, data: dict[str, object]) -> object:
    for key, value in data.items():
        if value is not None:
            setattr(record, key, value)
    return record


async def _delete_record(db: AsyncSession, record: object) -> None:
    await db.delete(record)
    await db.flush()


# ── Projects ──
async def list_projects(db: AsyncSession, user_id: int) -> list[ProjectRecord]:
    result = await db.execute(
        select(ProjectRecord)
        .where(ProjectRecord.user_id == user_id)
        .order_by(ProjectRecord.id.asc())
    )
    return list(result.scalars().all())


async def get_project(db: AsyncSession, record_id: int, user_id: int) -> ProjectRecord | None:
    result = await db.execute(
        select(ProjectRecord).where(ProjectRecord.id == record_id, ProjectRecord.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create_project(db: AsyncSession, user_id: int, data: dict[str, object]) -> ProjectRecord:
    record = ProjectRecord(user_id=user_id, **data)
    db.add(record)
    await db.flush()
    return record


async def update_project(record: ProjectRecord, data: dict[str, object]) -> ProjectRecord:
    for key, value in data.items():
        if value is not None:
            setattr(record, key, value)
    return record


async def delete_project(db: AsyncSession, record: ProjectRecord) -> None:
    await db.delete(record)
    await db.flush()


# ── Internships ──
async def list_internships(db: AsyncSession, user_id: int) -> list[InternshipRecord]:
    result = await db.execute(
        select(InternshipRecord)
        .where(InternshipRecord.user_id == user_id)
        .order_by(InternshipRecord.id.asc())
    )
    return list(result.scalars().all())


async def get_internship(db: AsyncSession, record_id: int, user_id: int) -> InternshipRecord | None:
    result = await db.execute(
        select(InternshipRecord).where(
            InternshipRecord.id == record_id, InternshipRecord.user_id == user_id
        )
    )
    return result.scalar_one_or_none()


async def create_internship(
    db: AsyncSession, user_id: int, data: dict[str, object]
) -> InternshipRecord:
    record = InternshipRecord(user_id=user_id, **data)
    db.add(record)
    await db.flush()
    return record


async def update_internship(
    record: InternshipRecord, data: dict[str, object]
) -> InternshipRecord:
    for key, value in data.items():
        if value is not None:
            setattr(record, key, value)
    return record


async def delete_internship(db: AsyncSession, record: InternshipRecord) -> None:
    await db.delete(record)
    await db.flush()


# ── Certifications ──
async def list_certifications(db: AsyncSession, user_id: int) -> list[CertificationRecord]:
    result = await db.execute(
        select(CertificationRecord)
        .where(CertificationRecord.user_id == user_id)
        .order_by(CertificationRecord.id.asc())
    )
    return list(result.scalars().all())


async def get_certification(
    db: AsyncSession, record_id: int, user_id: int
) -> CertificationRecord | None:
    result = await db.execute(
        select(CertificationRecord).where(
            CertificationRecord.id == record_id, CertificationRecord.user_id == user_id
        )
    )
    return result.scalar_one_or_none()


async def create_certification(
    db: AsyncSession, user_id: int, data: dict[str, object]
) -> CertificationRecord:
    record = CertificationRecord(user_id=user_id, **data)
    db.add(record)
    await db.flush()
    return record


async def update_certification(
    record: CertificationRecord, data: dict[str, object]
) -> CertificationRecord:
    for key, value in data.items():
        if value is not None:
            setattr(record, key, value)
    return record


async def delete_certification(db: AsyncSession, record: CertificationRecord) -> None:
    await db.delete(record)
    await db.flush()


# ── Education ──
async def list_education(db: AsyncSession, user_id: int) -> list[EducationRecord]:
    result = await db.execute(
        select(EducationRecord)
        .where(EducationRecord.user_id == user_id)
        .order_by(EducationRecord.id.asc())
    )
    return list(result.scalars().all())


async def get_education(
    db: AsyncSession, record_id: int, user_id: int
) -> EducationRecord | None:
    result = await db.execute(
        select(EducationRecord).where(
            EducationRecord.id == record_id, EducationRecord.user_id == user_id
        )
    )
    return result.scalar_one_or_none()


async def create_education(
    db: AsyncSession, user_id: int, data: dict[str, object]
) -> EducationRecord:
    record = EducationRecord(user_id=user_id, **data)
    db.add(record)
    await db.flush()
    return record


async def update_education(
    record: EducationRecord, data: dict[str, object]
) -> EducationRecord:
    for key, value in data.items():
        if value is not None:
            setattr(record, key, value)
    return record


async def delete_education(db: AsyncSession, record: EducationRecord) -> None:
    await db.delete(record)
    await db.flush()


# ── Portfolio (bulk replace) ──
async def list_portfolio(db: AsyncSession, user_id: int) -> list[PortfolioLink]:
    result = await db.execute(
        select(PortfolioLink)
        .where(PortfolioLink.user_id == user_id)
        .order_by(PortfolioLink.id.asc())
    )
    return list(result.scalars().all())


async def replace_portfolio(
    db: AsyncSession, user_id: int, links: list[dict[str, object]]
) -> list[PortfolioLink]:
    await db.execute(delete(PortfolioLink).where(PortfolioLink.user_id == user_id))
    records = []
    for link_data in links:
        record = PortfolioLink(user_id=user_id, **link_data)
        db.add(record)
        records.append(record)
    await db.flush()
    return records


# ── GitHub (single per user) ──
async def get_github_profile(db: AsyncSession, user_id: int) -> GitHubProfile | None:
    result = await db.execute(
        select(GitHubProfile).where(GitHubProfile.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def upsert_github_profile(
    db: AsyncSession, user_id: int, data: dict[str, object]
) -> GitHubProfile:
    existing = await get_github_profile(db, user_id)
    if existing:
        for key, value in data.items():
            setattr(existing, key, value)
        await db.flush()
        return existing
    record = GitHubProfile(user_id=user_id, **data)
    db.add(record)
    await db.flush()
    return record


# ── Uploads ──
async def list_uploads(db: AsyncSession, user_id: int) -> list[UploadedFile]:
    result = await db.execute(
        select(UploadedFile)
        .where(UploadedFile.user_id == user_id, UploadedFile.is_active.is_(True))
        .order_by(UploadedFile.id.asc())
    )
    return list(result.scalars().all())


async def get_upload(db: AsyncSession, file_id: int, user_id: int) -> UploadedFile | None:
    result = await db.execute(
        select(UploadedFile).where(UploadedFile.id == file_id, UploadedFile.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create_upload(db: AsyncSession, user_id: int, data: dict[str, object]) -> UploadedFile:
    record = UploadedFile(user_id=user_id, **data)
    db.add(record)
    await db.flush()
    return record


async def soft_delete_upload(record: UploadedFile) -> None:
    record.is_active = False


# ── Summary counts ──
async def count_by_user(db: AsyncSession, model: type, user_id: int) -> int:  # type: ignore[type-arg]
    from sqlalchemy import func

    result = await db.execute(
        select(func.count()).select_from(model).where(model.user_id == user_id)
    )
    count = result.scalar()
    return count if count is not None else 0
