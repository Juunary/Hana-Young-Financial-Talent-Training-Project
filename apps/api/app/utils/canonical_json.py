"""Canonical JSON serialization for reproducible hashes (§A.12)."""

import hashlib
import json
from datetime import date, datetime
from decimal import Decimal


class _CanonicalEncoder(json.JSONEncoder):
    """Deterministic encoder: explicit type handling, no implicit str fallback."""

    def default(self, obj: object) -> object:
        if isinstance(obj, datetime):
            return obj.strftime("%Y-%m-%dT%H:%M:%SZ")
        if isinstance(obj, date):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            normalized = obj.normalize()
            if normalized == int(normalized):
                return int(normalized)
            return float(normalized)
        raise TypeError(f"canonical_json_v1: non-serializable type {type(obj)!r}")


def canonical_json_v1(obj: dict) -> str:  # type: ignore[type-arg]
    """Serialize to canonical JSON per §A.12 rules.

    Rules:
    - Keys sorted by Unicode code point (sort_keys=True)
    - UTF-8, no ASCII escaping (ensure_ascii=False)
    - Compact separators, no whitespace
    - datetime → RFC 3339 UTC with Z suffix
    - date → ISO 8601 (YYYY-MM-DD)
    - Null values included as null (not omitted)
    - Array order preserved
    """
    return json.dumps(
        obj,
        cls=_CanonicalEncoder,
        sort_keys=True,
        ensure_ascii=False,
        separators=(",", ":"),
    )


def compute_hash(canonical: str) -> str:
    """SHA-256 of the canonical JSON string (UTF-8 encoded)."""
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()
