from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_current_user
from app.middleware.csrf import verify_csrf
from app.models.user import User
from app.repositories import user_repo
from app.schemas.user import (
    ConsentCreateRequest,
    ConsentStatusResponse,
    UserMeResponse,
    UserProfileResponse,
    UserProfileUpdate,
)
from app.services import audit_service

router = APIRouter(prefix="/api/v1", tags=["users"])


@router.get("/me", response_model=UserMeResponse)
async def get_me(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserMeResponse:
    consents = await user_repo.get_latest_consents(db, user.id)
    has_required = consents.get("privacy", False) and consents.get("evaluation", False)

    profile_resp = None
    if user.profile:
        profile_resp = UserProfileResponse(
            name=user.profile.name,
            birth_year=user.profile.birth_year,
            university=user.profile.university,
            major=user.profile.major,
            graduation_status=user.profile.graduation_status,
            employment_status=user.profile.employment_status,
        )

    return UserMeResponse(
        id=user.public_id,
        email=user.email,
        role=user.role,
        profile=profile_resp,
        has_required_consents=has_required,
    )


@router.patch("/me", response_model=UserProfileResponse)
async def update_me(
    body: UserProfileUpdate,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserProfileResponse:
    await verify_csrf(request)

    update_data = body.model_dump(exclude_unset=True)
    profile = await user_repo.update_profile(db, user.id, **update_data)

    await audit_service.log_event(
        db,
        event_name="user.profile_updated",
        actor_type="user",
        actor_id=user.id,
        resource_type="user_profile",
        resource_id=user.public_id,
    )
    await db.commit()

    return UserProfileResponse(
        name=profile.name,
        birth_year=profile.birth_year,
        university=profile.university,
        major=profile.major,
        graduation_status=profile.graduation_status,
        employment_status=profile.employment_status,
    )


@router.post("/consents", status_code=201)
async def create_consent(
    body: ConsentCreateRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    await verify_csrf(request)

    await user_repo.create_consent(
        db,
        user_id=user.id,
        consent_type=body.consent_type,
        consent_version=body.consent_version,
        accepted=body.accepted,
        accepted_at=datetime.now(UTC).isoformat(),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    await audit_service.log_event(
        db,
        event_name="consent.accepted" if body.accepted else "consent.declined",
        actor_type="user",
        actor_id=user.id,
        event_payload={"consent_type": body.consent_type, "version": body.consent_version},
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()

    return {"message": "동의가 기록되었습니다."}


@router.get("/consents/latest", response_model=ConsentStatusResponse)
async def get_latest_consents(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConsentStatusResponse:
    consents = await user_repo.get_latest_consents(db, user.id)
    return ConsentStatusResponse(
        privacy=consents.get("privacy", False),
        evaluation=consents.get("evaluation", False),
        data_usage=consents.get("data_usage", False),
    )
