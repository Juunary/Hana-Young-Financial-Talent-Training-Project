"""Auto-audit-logging middleware for state-changing requests.

Logs POST/PUT/PATCH/DELETE requests to the audit log automatically.
Manual audit calls in routers take precedence (more specific event names);
this middleware is a catch-all safety net for any missed events.
"""

import json
import re

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.db.session import async_session_factory
from app.middleware.session import get_redis
from app.services.audit_service import log_event

# Paths already instrumented by routers — skip to avoid duplicate logs
_SKIP_EVENT_PATHS: set[str] = {
    "/api/v1/auth/login",
    "/api/v1/auth/logout",
    "/api/v1/auth/signup",
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/reset-password",
}

# Only log these methods
_AUDIT_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

# Skip read-only and infrastructure endpoints
_SKIP_PREFIXES = ("/api/v1/health", "/api/v1/openapi.json", "/api/docs", "/api/redoc")

# Map (method, path_pattern) → event_name
_EVENT_MAP: list[tuple[str | None, re.Pattern[str], str]] = [
    ("POST", re.compile(r"^/api/v1/evaluations$"), "evaluation.requested"),
    ("POST", re.compile(r"^/api/v1/admin/evaluations/.+/review$"), "admin.review.created"),
    ("POST", re.compile(r"^/api/v1/admin/evaluations/.+/assign$"), "admin.assignment.created"),
    (None, re.compile(r"^/api/v1/evidence/"), "evidence.modified"),
    (None, re.compile(r"^/api/v1/uploads"), "file.modified"),
    (None, re.compile(r"^/api/v1/me"), "profile.modified"),
    (None, re.compile(r"^/api/v1/consents"), "consent.modified"),
    (None, re.compile(r"^/api/v1/admin/"), "admin.action"),
]

_RESOURCE_MAP: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"^/api/v1/evaluations/([^/]+)"), "evaluation"),
    (re.compile(r"^/api/v1/admin/evaluations/([^/]+)"), "evaluation"),
    (re.compile(r"^/api/v1/evidence/([^/]+)/([^/]+)"), "evidence"),
    (re.compile(r"^/api/v1/uploads/([^/]+)"), "upload"),
    (re.compile(r"^/api/v1/proof-records/([^/]+)"), "proof_record"),
]


def _derive_event_name(method: str, path: str) -> str:
    for rule_method, pattern, event_name in _EVENT_MAP:
        if rule_method is not None and rule_method != method:
            continue
        if pattern.search(path):
            return event_name
    return "api.state_change"


def _derive_resource(path: str) -> tuple[str | None, str | None]:
    for pattern, resource_type in _RESOURCE_MAP:
        m = pattern.search(path)
        if m:
            return resource_type, m.group(1) if m.lastindex and m.lastindex >= 1 else None
    return None, None


async def _get_session_user_id(request: Request) -> int | None:
    session_id = request.cookies.get("session_id")
    if not session_id:
        return None
    try:
        redis = await get_redis()
        raw = await redis.get(f"session:{session_id}")
        if raw is None:
            return None
        data: dict[str, object] = json.loads(raw)
        uid = data.get("user_id")
        return int(uid) if uid is not None else None
    except Exception:
        return None


def _get_client_ip(request: Request) -> str | None:
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else None


class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: object) -> Response:
        path = request.url.path
        method = request.method

        # Only audit state-changing requests
        if method not in _AUDIT_METHODS:
            return await call_next(request)  # type: ignore[operator]

        # Skip infrastructure paths
        if any(path.startswith(p) for p in _SKIP_PREFIXES):
            return await call_next(request)  # type: ignore[operator]

        # Skip already-instrumented auth paths
        if path in _SKIP_EVENT_PATHS:
            return await call_next(request)  # type: ignore[operator]

        response: Response = await call_next(request)  # type: ignore[operator]

        # Only log successful (2xx) state-changing requests
        if not (200 <= response.status_code < 300):
            return response

        try:
            actor_id = await _get_session_user_id(request)
            actor_type = "user" if actor_id else "system"
            event_name = _derive_event_name(method, path)
            resource_type, resource_id = _derive_resource(path)
            ip_address = _get_client_ip(request)
            user_agent = request.headers.get("User-Agent")

            async with async_session_factory() as db:
                await log_event(
                    db,
                    event_name=event_name,
                    actor_type=actor_type,
                    actor_id=actor_id,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                )
                await db.commit()
        except Exception:
            # Audit logging must never break the main request flow
            pass

        return response
