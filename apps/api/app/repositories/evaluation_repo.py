from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.evaluation import (
    EvaluationFactorScore,
    EvaluationInputSnapshot,
    EvaluationRequest,
    EvaluationResult,
    LoanRangeEstimate,
    ProofRecord,
)


# ── EvaluationRequest ──
async def create_evaluation_request(
    db: AsyncSession, user_id: int
) -> EvaluationRequest:
    request = EvaluationRequest(user_id=user_id)
    db.add(request)
    await db.flush()
    return request


async def get_request_by_public_id(
    db: AsyncSession, public_id: str
) -> EvaluationRequest | None:
    result = await db.execute(
        select(EvaluationRequest).where(EvaluationRequest.public_id == public_id)
    )
    return result.scalar_one_or_none()


async def get_request_by_id(
    db: AsyncSession, request_id: int
) -> EvaluationRequest | None:
    result = await db.execute(
        select(EvaluationRequest).where(EvaluationRequest.id == request_id)
    )
    return result.scalar_one_or_none()


async def list_requests_by_user(
    db: AsyncSession, user_id: int
) -> list[EvaluationRequest]:
    result = await db.execute(
        select(EvaluationRequest)
        .where(EvaluationRequest.user_id == user_id)
        .order_by(EvaluationRequest.requested_at.desc())
    )
    return list(result.scalars().all())


async def update_request_status(
    db: AsyncSession,
    request: EvaluationRequest,
    status: str,
    *,
    celery_task_id: str | None = None,
    input_snapshot_hash: str | None = None,
) -> None:
    request.status = status
    if celery_task_id is not None:
        request.celery_task_id = celery_task_id
    if input_snapshot_hash is not None:
        request.input_snapshot_hash = input_snapshot_hash
    await db.flush()


# ── EvaluationInputSnapshot ──
async def create_input_snapshot(
    db: AsyncSession,
    evaluation_request_id: int,
    snapshot_payload: dict,  # type: ignore[type-arg]
    payload_hash_sha256: str,
    evidence_record_ids: dict,  # type: ignore[type-arg]
    scoring_config_snapshot: dict,  # type: ignore[type-arg]
    scoring_config_version: str,
    model_version: str,
    prompt_version: str,
) -> EvaluationInputSnapshot:
    snapshot = EvaluationInputSnapshot(
        evaluation_request_id=evaluation_request_id,
        snapshot_payload=snapshot_payload,
        payload_hash_sha256=payload_hash_sha256,
        evidence_record_ids=evidence_record_ids,
        scoring_config_snapshot=scoring_config_snapshot,
        scoring_config_version=scoring_config_version,
        model_version=model_version,
        prompt_version=prompt_version,
    )
    db.add(snapshot)
    await db.flush()
    return snapshot


async def get_snapshot_by_request_id(
    db: AsyncSession, evaluation_request_id: int
) -> EvaluationInputSnapshot | None:
    result = await db.execute(
        select(EvaluationInputSnapshot).where(
            EvaluationInputSnapshot.evaluation_request_id == evaluation_request_id
        )
    )
    return result.scalar_one_or_none()


# ── EvaluationResult (written by ai-worker, read by API) ──
async def get_result_by_request_id(
    db: AsyncSession, evaluation_request_id: int
) -> EvaluationResult | None:
    result = await db.execute(
        select(EvaluationResult)
        .where(EvaluationResult.evaluation_request_id == evaluation_request_id)
        .options(
            selectinload(EvaluationResult.factor_scores),
            selectinload(EvaluationResult.loan_estimate),
            selectinload(EvaluationResult.proof_record),
        )
    )
    return result.scalar_one_or_none()


async def create_evaluation_result(
    db: AsyncSession,
    evaluation_request_id: int,
    data: dict,  # type: ignore[type-arg]
) -> EvaluationResult:
    ev_result = EvaluationResult(evaluation_request_id=evaluation_request_id, **data)
    db.add(ev_result)
    await db.flush()
    return ev_result


async def create_factor_score(
    db: AsyncSession, evaluation_result_id: int, data: dict  # type: ignore[type-arg]
) -> EvaluationFactorScore:
    factor = EvaluationFactorScore(evaluation_result_id=evaluation_result_id, **data)
    db.add(factor)
    await db.flush()
    return factor


async def create_loan_estimate(
    db: AsyncSession, evaluation_result_id: int, data: dict  # type: ignore[type-arg]
) -> LoanRangeEstimate:
    estimate = LoanRangeEstimate(evaluation_result_id=evaluation_result_id, **data)
    db.add(estimate)
    await db.flush()
    return estimate


# ── ProofRecord ──
async def create_proof_record(
    db: AsyncSession,
    evaluation_result_id: int,
    canonical_payload_json: dict,  # type: ignore[type-arg]
    payload_hash_sha256: str,
    evidence_combined_hash: str,
) -> ProofRecord:
    proof = ProofRecord(
        evaluation_result_id=evaluation_result_id,
        canonical_payload_json=canonical_payload_json,
        payload_hash_sha256=payload_hash_sha256,
        evidence_combined_hash=evidence_combined_hash,
    )
    db.add(proof)
    await db.flush()
    return proof


async def get_proof_by_public_id(
    db: AsyncSession, public_id: str
) -> ProofRecord | None:
    result = await db.execute(
        select(ProofRecord).where(ProofRecord.public_id == public_id)
    )
    return result.scalar_one_or_none()


async def get_proof_by_result_id(
    db: AsyncSession, evaluation_result_id: int
) -> ProofRecord | None:
    result = await db.execute(
        select(ProofRecord).where(
            ProofRecord.evaluation_result_id == evaluation_result_id
        )
    )
    return result.scalar_one_or_none()
