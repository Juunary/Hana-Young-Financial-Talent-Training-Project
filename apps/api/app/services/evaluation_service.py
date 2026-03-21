"""Evaluation request creation + input snapshot generation (§A.11)."""

import json
from datetime import date, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.evaluation import EvaluationRequest
from app.models.user import User
from app.repositories import evaluation_repo
from app.repositories import evidence_repo as ev_repo
from app.utils.canonical_json import canonical_json_v1, compute_hash

# ── Scoring config snapshot (inlined for API use, mirrors ai-worker YAML) ──
SCORING_CONFIG: dict = {  # type: ignore[type-arg]
    "version": "1.0.0",
    "factors": {
        "academic": {"display_name": "학업 역량", "max_score": 15},
        "project": {"display_name": "프로젝트 깊이", "max_score": 25},
        "internship": {"display_name": "실무 경험", "max_score": 20},
        "certification": {"display_name": "자격/인증", "max_score": 10},
        "portfolio": {"display_name": "포트폴리오", "max_score": 15},
        "github": {"display_name": "GitHub 활동", "max_score": 10},
        "consistency": {"display_name": "일관성/완성도", "max_score": 5},
    },
    "grade_thresholds": {
        "S": 90, "A+": 85, "A": 80, "B+": 70, "B": 60, "C+": 50, "C": 40, "D": 0
    },
    "loan_simulation": {
        "disclaimer": (
            "본 결과는 프로토타입 시뮬레이션이며, 실제 금융기관의 대출 심사와 무관합니다."
        ),
        "ranges": [
            {"min_score": 80, "min_amount": 30000000, "max_amount": 50000000},
            {"min_score": 60, "min_amount": 15000000, "max_amount": 30000000},
            {"min_score": 40, "min_amount": 5000000, "max_amount": 15000000},
            {"min_score": 0, "min_amount": 1000000, "max_amount": 5000000},
        ],
    },
}

MODEL_VERSION = "anthropic:claude-sonnet-4-6"
PROMPT_VERSION = "1.0.0"


def _serialize_value(v: object) -> object:
    """Convert ORM field values to JSON-serializable primitives."""
    if isinstance(v, datetime):
        return v.strftime("%Y-%m-%dT%H:%M:%SZ")
    if isinstance(v, date):
        return v.isoformat()
    if v is None:
        return None
    return v


async def _build_evidence_snapshot(
    db: AsyncSession, user_id: int
) -> tuple[dict, dict]:  # type: ignore[type-arg]
    """
    Collect all evidence for a user and return:
    - snapshot_payload: full evidence dict for canonical JSON
    - evidence_record_ids: dict of {category: [ids]}
    """
    academic = await ev_repo.get_academic(db, user_id)
    projects = await ev_repo.list_projects(db, user_id)
    internships = await ev_repo.list_internships(db, user_id)
    certifications = await ev_repo.list_certifications(db, user_id)
    education = await ev_repo.list_education(db, user_id)
    portfolio = await ev_repo.list_portfolio(db, user_id)
    github = await ev_repo.get_github_profile(db, user_id)
    uploads = await ev_repo.list_uploads(db, user_id)

    def model_to_dict(obj: object, exclude: set[str] | None = None) -> dict:  # type: ignore[type-arg]
        exclude = exclude or set()
        result = {}
        for col in obj.__class__.__table__.columns:  # type: ignore[attr-defined]
            if col.name in exclude:
                continue
            result[col.name] = _serialize_value(getattr(obj, col.name))
        return result

    payload: dict = {  # type: ignore[type-arg]
        "academic": model_to_dict(academic, {"user_id"}) if academic else None,
        "projects": [model_to_dict(p, {"user_id"}) for p in projects],
        "internships": [model_to_dict(i, {"user_id"}) for i in internships],
        "certifications": [model_to_dict(c, {"user_id"}) for c in certifications],
        "education": [model_to_dict(e, {"user_id"}) for e in education],
        "portfolio": [model_to_dict(lnk, {"user_id"}) for lnk in portfolio],
        "github": model_to_dict(github, {"user_id"}) if github else None,
        "uploads": [
            {
                "file_id": u.id,
                "original_filename": u.original_filename,
                "file_key": u.file_key,
                "mime_type": u.mime_type,
                "file_size": u.file_size,
            }
            for u in uploads
        ],
    }

    record_ids: dict = {  # type: ignore[type-arg]
        "academic": [academic.id] if academic else [],
        "projects": [p.id for p in projects],
        "internships": [i.id for i in internships],
        "certifications": [c.id for c in certifications],
        "education": [e.id for e in education],
        "portfolio": [lnk.id for lnk in portfolio],
        "github": [github.id] if github else [],
        "uploads": [u.id for u in uploads],
    }

    return payload, record_ids


async def create_evaluation_request(
    db: AsyncSession,
    user: User,
    celery_send_task: object,  # callable: (task_name, args) → AsyncResult
) -> EvaluationRequest:
    """Create an evaluation request with a frozen input snapshot.

    Steps (§A.11):
    1. Collect all user evidence → canonical JSON → SHA-256 hash
    2. Create EvaluationRequest row
    3. Create EvaluationInputSnapshot row (evidence + scoring recipe)
    4. Dispatch Celery task
    5. Store task ID
    """
    # 1. Build snapshot
    snapshot_payload, evidence_record_ids = await _build_evidence_snapshot(db, user.id)
    canonical = canonical_json_v1(snapshot_payload)
    payload_hash = compute_hash(canonical)

    # 2. Create request
    request = await evaluation_repo.create_evaluation_request(db, user.id)

    # 3. Create input snapshot
    await evaluation_repo.create_input_snapshot(
        db,
        evaluation_request_id=request.id,
        snapshot_payload=json.loads(canonical),
        payload_hash_sha256=payload_hash,
        evidence_record_ids=evidence_record_ids,
        scoring_config_snapshot=SCORING_CONFIG,
        scoring_config_version=SCORING_CONFIG["version"],
        model_version=MODEL_VERSION,
        prompt_version=PROMPT_VERSION,
    )
    request.input_snapshot_hash = payload_hash

    await db.commit()
    await db.refresh(request)

    # 4. Dispatch Celery task (fire-and-forget; failure is non-fatal here)
    try:
        task = celery_send_task(  # type: ignore[operator]
            "app.tasks.evaluation_task.run_evaluation", args=[request.id]
        )
        request.celery_task_id = str(task.id)
        await db.commit()
        await db.refresh(request)
    except Exception:
        pass  # Task dispatch failure: request stays in "pending", worker can retry

    return request
