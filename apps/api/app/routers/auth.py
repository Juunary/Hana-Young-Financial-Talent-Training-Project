import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.session import get_db
from app.dependencies import get_current_user
from app.middleware.session import create_session, delete_session, get_redis, rotate_session
from app.models.user import User
from app.repositories import user_repo
from app.schemas.auth import (
    CsrfTokenResponse,
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponse,
    MessageResponse,
    ResetPasswordRequest,
    SignupRequest,
    SignupResponse,
)
from app.services import audit_service
from app.utils.hashing import hash_password, verify_password

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

# Login attempt tracking constants
_MAX_LOGIN_ATTEMPTS = 5
_LOCKOUT_SECONDS = 900  # 15 minutes


def _set_session_cookie(response: Response, session_id: str) -> None:
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=session_id,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax",
        max_age=settings.SESSION_TTL_SECONDS,
        path="/",
    )


def _clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        path="/",
    )


async def _check_brute_force(email: str) -> None:
    """Check and enforce login attempt rate limiting."""
    redis = await get_redis()
    key = f"login_attempts:{email}"
    attempts = await redis.get(key)
    if attempts is not None and int(attempts) >= _MAX_LOGIN_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail="로그인 시도 횟수를 초과했습니다. 15분 후 다시 시도하세요.",
        )


async def _record_failed_attempt(email: str) -> None:
    redis = await get_redis()
    key = f"login_attempts:{email}"
    pipe = redis.pipeline()
    pipe.incr(key)
    pipe.expire(key, _LOCKOUT_SECONDS)
    await pipe.execute()


async def _clear_failed_attempts(email: str) -> None:
    redis = await get_redis()
    await redis.delete(f"login_attempts:{email}")


@router.post("/signup", response_model=SignupResponse, status_code=201)
async def signup(
    body: SignupRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> SignupResponse:
    existing = await user_repo.get_by_email(db, body.email)
    if existing is not None:
        raise HTTPException(status_code=409, detail="이미 등록된 이메일입니다.")

    pw_hash = hash_password(body.password)
    user = await user_repo.create_user(db, body.email, pw_hash, body.name)

    session_id, _ = await create_session(user.id, user.role)
    _set_session_cookie(response, session_id)

    await audit_service.log_event(
        db,
        event_name="auth.signup",
        actor_type="user",
        actor_id=user.id,
        resource_type="user",
        resource_id=user.public_id,
        event_payload={"email": body.email},
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    await db.commit()

    return SignupResponse(id=user.public_id, email=user.email)


@router.post("/login", response_model=LoginResponse)
async def login(
    body: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> LoginResponse:
    await _check_brute_force(body.email)

    user = await user_repo.get_by_email(db, body.email)
    if user is None or not verify_password(body.password, user.password_hash):
        await _record_failed_attempt(body.email)

        await audit_service.log_event(
            db,
            event_name="auth.login_failed",
            actor_type="system",
            event_payload={"email": body.email},
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
        await db.commit()
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="비활성화된 계정입니다.")

    await _clear_failed_attempts(body.email)

    # Session rotation: delete any existing session, create new
    old_session_id = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if old_session_id:
        session_id, csrf_token = await rotate_session(old_session_id, user.id, user.role)
    else:
        session_id, csrf_token = await create_session(user.id, user.role)

    _set_session_cookie(response, session_id)

    await audit_service.log_event(
        db,
        event_name="auth.login",
        actor_type="user",
        actor_id=user.id,
        resource_type="user",
        resource_id=user.public_id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    await db.commit()

    return LoginResponse(
        id=user.public_id,
        email=user.email,
        role=user.role,
        csrf_token=csrf_token,
    )


@router.post("/logout", status_code=204)
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    session_id = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if session_id:
        await delete_session(session_id)

    _clear_session_cookie(response)

    await audit_service.log_event(
        db,
        event_name="auth.logout",
        actor_type="user",
        actor_id=user.id,
        ip_address=request.client.host if request.client else None,
    )
    await db.commit()


@router.post("/refresh", response_model=LoginResponse)
async def refresh_session(
    request: Request,
    response: Response,
    user: User = Depends(get_current_user),
) -> LoginResponse:
    old_session_id = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not old_session_id:
        raise HTTPException(status_code=401, detail="세션이 없습니다.")

    session_id, csrf_token = await rotate_session(old_session_id, user.id, user.role)
    _set_session_cookie(response, session_id)

    return LoginResponse(
        id=user.public_id,
        email=user.email,
        role=user.role,
        csrf_token=csrf_token,
    )


@router.get("/csrf-token", response_model=CsrfTokenResponse)
async def get_csrf_token_endpoint(
    request: Request,
    _user: User = Depends(get_current_user),
) -> CsrfTokenResponse:
    from app.middleware.session import get_csrf_token

    session_id = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not session_id:
        raise HTTPException(status_code=401, detail="세션이 없습니다.")

    token = await get_csrf_token(session_id)
    if token is None:
        raise HTTPException(status_code=401, detail="세션이 만료되었습니다.")

    return CsrfTokenResponse(csrf_token=token)


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    body: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Request password reset. Always returns success to prevent email enumeration."""
    user = await user_repo.get_by_email(db, body.email)
    if user is not None:
        # Generate reset token and store in Redis
        reset_token = str(uuid.uuid4())
        redis = await get_redis()
        await redis.setex(
            f"password_reset:{reset_token}",
            1800,  # 30 minutes
            str(user.id),
        )
        # TODO: Send email via Mailhog in dev
        await audit_service.log_event(
            db,
            event_name="auth.password_reset_requested",
            actor_type="user",
            actor_id=user.id,
            event_payload={"email": body.email},
        )
        await db.commit()

    return MessageResponse(message="비밀번호 재설정 안내가 이메일로 전송되었습니다.")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    redis = await get_redis()
    user_id_str = await redis.get(f"password_reset:{body.token}")
    if user_id_str is None:
        raise HTTPException(status_code=400, detail="유효하지 않거나 만료된 토큰입니다.")

    user = await user_repo.get_by_id(db, int(user_id_str))
    if user is None:
        raise HTTPException(status_code=400, detail="사용자를 찾을 수 없습니다.")

    new_hash = hash_password(body.new_password)
    await user_repo.update_password(db, user, new_hash)

    # Invalidate reset token
    await redis.delete(f"password_reset:{body.token}")

    await audit_service.log_event(
        db,
        event_name="auth.password_reset_completed",
        actor_type="user",
        actor_id=user.id,
    )
    await db.commit()

    return MessageResponse(message="비밀번호가 성공적으로 변경되었습니다.")
