"""Redis-based sliding-window rate limiting middleware."""

import json
import time

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.middleware.session import get_redis

# ── Rate limit rules ──────────────────────────────────────────────────────────
# Each entry: (path_prefix, method, max_requests, window_seconds, key_scope)
# key_scope: "ip" | "user"
_RULES: list[tuple[str, str | None, int, int, str]] = [
    # Auth endpoints: 10 requests / 60 s per IP (brute-force second layer)
    ("/api/v1/auth/login", "POST", 10, 60, "ip"),
    ("/api/v1/auth/signup", "POST", 10, 60, "ip"),
    ("/api/v1/auth/forgot-password", "POST", 10, 60, "ip"),
    ("/api/v1/auth/reset-password", "POST", 10, 60, "ip"),
    # Evaluation requests: 5 / 3600 s per user (LLM cost control)
    ("/api/v1/evaluations", "POST", 5, 3600, "user"),
    # Evidence uploads: 20 / 60 s per user
    ("/api/v1/uploads", "POST", 20, 60, "user"),
    # Admin review submit: 60 / 60 s per user
    ("/api/v1/admin", None, 60, 60, "user"),
    # General API fallback: 120 / 60 s per IP
    ("/api/v1", None, 120, 60, "ip"),
]

_SKIP_PATHS = {"/api/v1/health", "/api/v1/openapi.json"}


def _get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def _get_user_id_from_session(request: Request) -> str | None:
    session_id = request.cookies.get("session_id")
    if not session_id:
        return None
    try:
        redis = await get_redis()
        raw = await redis.get(f"session:{session_id}")
        if raw is None:
            return None
        data: dict[str, object] = json.loads(raw)
        return str(data.get("user_id", ""))
    except Exception:
        return None


async def _check_rate_limit(key: str, max_requests: int, window_seconds: int) -> tuple[bool, int]:
    """Sliding window rate limit using Redis sorted set.

    Returns (allowed, retry_after_seconds).
    """
    redis = await get_redis()
    now = time.time()
    window_start = now - window_seconds

    pipe = redis.pipeline()
    pipe.zremrangebyscore(key, "-inf", window_start)
    pipe.zadd(key, {str(now): now})
    pipe.zcard(key)
    pipe.expire(key, window_seconds + 1)
    results = await pipe.execute()

    count: int = results[2]

    if count > max_requests:
        oldest = await redis.zrange(key, 0, 0, withscores=True)
        retry_after = int(window_seconds - (now - oldest[0][1])) + 1 if oldest else window_seconds
        return False, max(retry_after, 1)

    return True, 0


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: object) -> Response:
        path = request.url.path
        method = request.method

        # Skip health checks and OpenAPI spec
        if path in _SKIP_PATHS:
            return await call_next(request)  # type: ignore[operator]

        # Find matching rule (first match wins)
        for path_prefix, rule_method, max_req, window, scope in _RULES:
            if not path.startswith(path_prefix):
                continue
            if rule_method is not None and method != rule_method:
                continue

            # Determine rate limit key
            if scope == "user":
                user_id = await _get_user_id_from_session(request)
                if user_id:
                    rl_key = f"rl:user:{path_prefix}:{user_id}"
                else:
                    # Fall back to IP for unauthenticated requests
                    rl_key = f"rl:ip:{path_prefix}:{_get_client_ip(request)}"
            else:
                rl_key = f"rl:ip:{path_prefix}:{_get_client_ip(request)}"

            try:
                allowed, retry_after = await _check_rate_limit(rl_key, max_req, window)
            except Exception:
                # Redis unavailable — fail open (don't block requests)
                break

            if not allowed:
                body = (
                    '{"error":{"code":"RATE_LIMIT_EXCEEDED",'
                    '"message":"요청 횟수 제한을 초과했습니다. 잠시 후 다시 시도하세요."}}'
                )
                return Response(
                    content=body,
                    status_code=429,
                    headers={
                        "Content-Type": "application/json",
                        "Retry-After": str(retry_after),
                        "X-RateLimit-Limit": str(max_req),
                        "X-RateLimit-Window": str(window),
                    },
                )
            break  # First matching rule applied; no further rules checked

        return await call_next(request)  # type: ignore[operator]
