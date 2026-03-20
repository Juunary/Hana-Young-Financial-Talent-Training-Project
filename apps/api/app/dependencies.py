from fastapi import Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.session import get_db
from app.middleware.session import get_session
from app.models.user import User
from app.repositories import user_repo


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate user from session cookie."""
    session_id = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not session_id:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")

    session_data = await get_session(session_id)
    if session_data is None:
        raise HTTPException(status_code=401, detail="세션이 만료되었습니다.")

    user_id = session_data["user_id"]
    if not isinstance(user_id, int):
        raise HTTPException(status_code=401, detail="잘못된 세션 데이터입니다.")
    user = await user_repo.get_by_id(db, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="사용자를 찾을 수 없습니다.")

    return user


async def get_admin_user(
    user: User = Depends(get_current_user),
) -> User:
    """Require admin role."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")
    return user


async def get_admin_or_reviewer_user(
    user: User = Depends(get_current_user),
) -> User:
    """Require admin or reviewer role."""
    if user.role not in ("admin", "reviewer"):
        raise HTTPException(status_code=403, detail="관리자 또는 심사자 권한이 필요합니다.")
    return user
