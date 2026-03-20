import re

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog

# PII fields to redact in event payloads
_PII_FIELDS = {"email", "name", "ip_address"}
_EMAIL_PATTERN = re.compile(r"(^[^@]{1})[^@]*(@.+)$")


def _redact_email(email: str) -> str:
    """j***@example.com"""
    match = _EMAIL_PATTERN.match(email)
    if match:
        return f"{match.group(1)}***{match.group(2)}"
    return "***"


def redact_pii(payload: dict[str, object] | None) -> dict[str, object] | None:
    """Mask PII fields in audit log payloads."""
    if payload is None:
        return None

    redacted: dict[str, object] = {}
    for key, value in payload.items():
        if key in _PII_FIELDS and isinstance(value, str):
            if key == "email":
                redacted[key] = _redact_email(value)
            else:
                redacted[key] = f"{value[:1]}***" if value else "***"
        else:
            redacted[key] = value
    return redacted


async def log_event(
    db: AsyncSession,
    *,
    event_name: str,
    actor_type: str = "system",
    actor_id: int | None = None,
    resource_type: str | None = None,
    resource_id: str | None = None,
    event_payload: dict[str, object] | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> None:
    """Record an audit log entry with PII redaction."""
    log = AuditLog(
        actor_type=actor_type,
        actor_id=actor_id,
        event_name=event_name,
        event_payload_json=redact_pii(event_payload),
        resource_type=resource_type,
        resource_id=resource_id,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(log)
    await db.flush()
