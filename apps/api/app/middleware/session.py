import json
import uuid
from datetime import UTC, datetime

import redis.asyncio as aioredis

from app.config import settings

_redis: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis


def _session_key(session_id: str) -> str:
    return f"session:{session_id}"


async def create_session(user_id: int, role: str) -> tuple[str, str]:
    """Create a new session in Redis. Returns (session_id, csrf_token)."""
    redis = await get_redis()
    session_id = str(uuid.uuid4())
    csrf_token = str(uuid.uuid4())
    now = datetime.now(UTC).isoformat()

    session_data = json.dumps(
        {
            "user_id": user_id,
            "role": role,
            "csrf_token": csrf_token,
            "created_at": now,
            "last_active": now,
        }
    )

    await redis.setex(_session_key(session_id), settings.SESSION_TTL_SECONDS, session_data)
    return session_id, csrf_token


async def get_session(session_id: str) -> dict[str, object] | None:
    """Get session data from Redis. Returns None if expired/missing."""
    redis = await get_redis()
    raw = await redis.get(_session_key(session_id))
    if raw is None:
        return None

    data: dict[str, object] = json.loads(raw)

    # Refresh TTL on activity
    await redis.expire(_session_key(session_id), settings.SESSION_TTL_SECONDS)
    data["last_active"] = datetime.now(UTC).isoformat()
    await redis.setex(
        _session_key(session_id),
        settings.SESSION_TTL_SECONDS,
        json.dumps(data),
    )
    return data


async def delete_session(session_id: str) -> None:
    """Delete a session from Redis."""
    redis = await get_redis()
    await redis.delete(_session_key(session_id))


async def rotate_session(old_session_id: str, user_id: int, role: str) -> tuple[str, str]:
    """Delete old session and create new one (Session Fixation prevention)."""
    await delete_session(old_session_id)
    return await create_session(user_id, role)


async def get_csrf_token(session_id: str) -> str | None:
    """Get CSRF token from session."""
    session = await get_session(session_id)
    if session is None:
        return None
    token = session.get("csrf_token")
    return str(token) if token is not None else None
