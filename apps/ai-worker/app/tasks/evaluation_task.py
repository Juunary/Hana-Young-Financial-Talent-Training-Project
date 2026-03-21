"""Celery evaluation task: runs the 3-agent pipeline and saves results to DB."""

import asyncio
import json
import logging
from datetime import datetime, timezone

from app.celery_app import celery_app

logger = logging.getLogger(__name__)

STALE_PROCESSING_MINUTES = 10


@celery_app.task(bind=True, max_retries=2)  # type: ignore[untyped-decorator]
def run_evaluation(self: object, evaluation_request_id: int) -> dict[str, str]:
    """Dispatch async evaluation pipeline via sync wrapper (§A.10)."""
    logger.info(f"Starting evaluation task for request {evaluation_request_id}")
    asyncio.run(_run_evaluation_async(self, evaluation_request_id))
    return {"status": "ok", "evaluation_request_id": str(evaluation_request_id)}


async def _run_evaluation_async(task_self: object, evaluation_request_id: int) -> None:
    import os

    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

    db_url = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/skillfinance",
    )
    engine = create_async_engine(db_url)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as db:
        await _execute_pipeline(task_self, db, evaluation_request_id)

    await engine.dispose()


async def _execute_pipeline(task_self: object, db: object, evaluation_request_id: int) -> None:
    from sqlalchemy import text
    from sqlalchemy.ext.asyncio import AsyncSession

    assert isinstance(db, AsyncSession)

    from app.agents.pipeline import run_pipeline

    # Read request row
    row = (
        await db.execute(
            text("SELECT id, status, started_at FROM evaluation_requests WHERE id = :id").bindparams(
                id=evaluation_request_id
            )
        )
    ).fetchone()

    if row is None:
        logger.error(f"Evaluation request {evaluation_request_id} not found")
        return

    status = row[1]
    started_at = row[2]

    # Idempotency guard (§A.5)
    if status == "completed":
        logger.info(f"Request {evaluation_request_id} already completed, skipping")
        return

    if status == "processing" and started_at:
        elapsed = (datetime.now(timezone.utc).replace(tzinfo=None) - started_at).total_seconds()
        if elapsed < STALE_PROCESSING_MINUTES * 60:
            logger.warning(f"Request {evaluation_request_id} still processing by another worker")
            return

    async def set_stage(stage: str) -> None:
        await db.execute(
            text(
                "UPDATE evaluation_requests SET current_stage = :stage WHERE id = :id"
            ).bindparams(stage=stage, id=evaluation_request_id)
        )
        await db.commit()

    # Mark processing
    await db.execute(
        text(
            "UPDATE evaluation_requests SET status = 'processing', started_at = :now, "
            "current_stage = 'normalizing' WHERE id = :id"
        ).bindparams(now=datetime.utcnow(), id=evaluation_request_id)
    )
    await db.commit()

    try:
        # Load snapshot
        snap = (
            await db.execute(
                text(
                    "SELECT snapshot_payload, payload_hash_sha256, "
                    "scoring_config_version, model_version "
                    "FROM evaluation_input_snapshots WHERE evaluation_request_id = :id"
                ).bindparams(id=evaluation_request_id)
            )
        ).fetchone()

        if snap is None:
            raise RuntimeError(f"No snapshot for request {evaluation_request_id}")

        snapshot_payload = snap[0]
        evidence_hash = snap[1]
        scoring_config_version = snap[2]
        model_version = snap[3]

        # Run pipeline
        normalized, scoring, explanation, elapsed_ms = await run_pipeline(
            snapshot_payload,
            stage_callback=lambda s: asyncio.ensure_future(set_stage(s)),
        )

        await set_stage("saving")

        # Compute loan range (rule-based, not LLM)
        loan_min, loan_max = 1_000_000, 5_000_000
        for threshold, lo, hi in [
            (80, 30_000_000, 50_000_000),
            (60, 15_000_000, 30_000_000),
            (40, 5_000_000, 15_000_000),
        ]:
            if float(scoring.total_score) >= threshold:
                loan_min, loan_max = lo, hi
                break

        raw_response = {
            "normalized": normalized.model_dump(),
            "scoring": scoring.model_dump(),
            "explanation": explanation.model_dump(),
        }

        # Insert evaluation_results
        result_row = (
            await db.execute(
                text(
                    "INSERT INTO evaluation_results "
                    "(evaluation_request_id, total_score, grade, confidence_level, "
                    "overall_summary, strengths, improvement_areas, risk_flags, "
                    "needs_human_review, model_version, scoring_config_version, "
                    "raw_ai_response, processing_time_ms) "
                    "VALUES (:req_id, :total, :grade, :conf, :summary, :strengths, "
                    ":improvements, :risks, :review, :model, :config_ver, :raw, :ms) "
                    "RETURNING id"
                ).bindparams(
                    req_id=evaluation_request_id,
                    total=round(float(scoring.total_score), 2),
                    grade=scoring.grade,
                    conf=0.8,
                    summary=explanation.overall_summary,
                    strengths=json.dumps(explanation.strengths, ensure_ascii=False),
                    improvements=json.dumps(
                        explanation.improvement_areas, ensure_ascii=False
                    ),
                    risks=json.dumps(scoring.risk_flags, ensure_ascii=False),
                    review=scoring.needs_human_review,
                    model=model_version,
                    config_ver=scoring_config_version,
                    raw=json.dumps(raw_response, ensure_ascii=False, default=str),
                    ms=elapsed_ms,
                )
            )
        ).fetchone()
        await db.commit()
        result_id = result_row[0]

        # Insert factor scores
        for fs in scoring.factor_scores:
            await db.execute(
                text(
                    "INSERT INTO evaluation_factor_scores "
                    "(evaluation_result_id, factor_name, score_value, max_score, "
                    "reason_codes, explanation, confidence) "
                    "VALUES (:result_id, :name, :score, :max, :codes, :explanation, :conf)"
                ).bindparams(
                    result_id=result_id,
                    name=fs.factor_name,
                    score=round(float(fs.score_value), 2),
                    max=float(fs.max_score),
                    codes=json.dumps(fs.reason_codes, ensure_ascii=False),
                    explanation=fs.explanation,
                    conf=float(fs.confidence),
                )
            )

        # Insert loan estimate
        await db.execute(
            text(
                "INSERT INTO loan_range_estimates "
                "(evaluation_result_id, range_min, range_max, rationale, disclaimer_text) "
                "VALUES (:result_id, :min, :max, :rationale, :disclaimer)"
            ).bindparams(
                result_id=result_id,
                min=loan_min,
                max=loan_max,
                rationale=explanation.loan_estimate.rationale,
                disclaimer=explanation.loan_estimate.disclaimer,
            )
        )
        await db.commit()

        # Create proof record
        import hashlib
        import uuid

        proof_payload = {
            "evaluation_request_id": evaluation_request_id,
            "total_score": round(float(scoring.total_score), 2),
            "grade": scoring.grade,
            "factor_scores": [
                {"factor": fs.factor_name, "score": round(float(fs.score_value), 2)}
                for fs in scoring.factor_scores
            ],
            "model_version": model_version,
            "scoring_config_version": scoring_config_version,
            "evidence_hash": evidence_hash,
        }
        canonical = json.dumps(
            proof_payload, sort_keys=True, ensure_ascii=False, separators=(",", ":")
        )
        proof_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()

        await db.execute(
            text(
                "INSERT INTO proof_records "
                "(public_id, evaluation_result_id, canonical_payload_json, "
                "payload_hash_sha256, evidence_combined_hash) "
                "VALUES (:pub_id, :result_id, :payload, :hash, :ev_hash)"
            ).bindparams(
                pub_id=str(uuid.uuid4()),
                result_id=result_id,
                payload=canonical,
                hash=proof_hash,
                ev_hash=evidence_hash,
            )
        )

        # Complete
        await db.execute(
            text(
                "UPDATE evaluation_requests SET status = 'completed', "
                "completed_at = :now, current_stage = NULL WHERE id = :id"
            ).bindparams(now=datetime.utcnow(), id=evaluation_request_id)
        )
        await db.commit()
        logger.info(f"Evaluation {evaluation_request_id} completed")

    except Exception as e:
        logger.exception(f"Evaluation {evaluation_request_id} failed: {e}")
        await db.execute(
            text(
                "UPDATE evaluation_requests SET status = 'failed', "
                "error_message = :msg WHERE id = :id"
            ).bindparams(msg=str(e)[:1000], id=evaluation_request_id)
        )
        await db.commit()
        raise task_self.retry(exc=e)  # type: ignore[attr-defined]
