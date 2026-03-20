from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import ConsentRecord, User, UserProfile


async def get_by_id(db: AsyncSession, user_id: int) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_by_public_id(db: AsyncSession, public_id: str) -> User | None:
    result = await db.execute(select(User).where(User.public_id == public_id))
    return result.scalar_one_or_none()


async def get_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, email: str, password_hash: str, name: str) -> User:
    user = User(email=email, password_hash=password_hash)
    db.add(user)
    await db.flush()

    profile = UserProfile(user_id=user.id, name=name)
    db.add(profile)
    await db.commit()
    await db.refresh(user)
    return user


async def get_profile(db: AsyncSession, user_id: int) -> UserProfile | None:
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    return result.scalar_one_or_none()


async def update_profile(
    db: AsyncSession,
    user_id: int,
    **fields: str | int | None,
) -> UserProfile:
    profile = await get_profile(db, user_id)
    if profile is None:
        profile = UserProfile(user_id=user_id, name=fields.get("name", ""))
        db.add(profile)

    for key, value in fields.items():
        if value is not None and hasattr(profile, key):
            setattr(profile, key, value)

    await db.commit()
    await db.refresh(profile)
    return profile


async def get_latest_consents(db: AsyncSession, user_id: int) -> dict[str, bool]:
    """Get latest consent status per type."""
    result = await db.execute(
        select(ConsentRecord)
        .where(ConsentRecord.user_id == user_id)
        .order_by(ConsentRecord.id.desc())
    )
    records = result.scalars().all()

    consent_map: dict[str, bool] = {}
    for record in records:
        if record.consent_type not in consent_map:
            consent_map[record.consent_type] = record.accepted
    return consent_map


async def create_consent(
    db: AsyncSession,
    user_id: int,
    consent_type: str,
    consent_version: str,
    accepted: bool,
    accepted_at: str,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> ConsentRecord:
    record = ConsentRecord(
        user_id=user_id,
        consent_type=consent_type,
        consent_version=consent_version,
        accepted=accepted,
        accepted_at=accepted_at,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(record)
    await db.commit()
    return record


async def update_password(db: AsyncSession, user: User, new_password_hash: str) -> None:
    user.password_hash = new_password_hash
    await db.commit()
