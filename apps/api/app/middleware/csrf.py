from fastapi import HTTPException, Request

from app.config import settings
from app.middleware.session import get_csrf_token

# Methods that require CSRF protection
_STATE_CHANGING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

# Paths exempt from CSRF (login/signup don't have a session yet)
_CSRF_EXEMPT_PATHS = {
    "/api/v1/auth/login",
    "/api/v1/auth/signup",
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/reset-password",
}


async def verify_csrf(request: Request) -> None:
    """Verify CSRF token for state-changing requests.

    Call this in route handlers or as a dependency for state-changing endpoints.
    """
    if request.method not in _STATE_CHANGING_METHODS:
        return

    if request.url.path in _CSRF_EXEMPT_PATHS:
        return

    session_id = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not session_id:
        raise HTTPException(status_code=401, detail="세션이 없습니다.")

    expected_token = await get_csrf_token(session_id)
    if expected_token is None:
        raise HTTPException(status_code=401, detail="세션이 만료되었습니다.")

    provided_token = request.headers.get("X-CSRF-Token")
    if not provided_token or provided_token != expected_token:
        raise HTTPException(status_code=403, detail="CSRF 토큰이 유효하지 않습니다.")
