from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.celery_client import celery_client
from app.db.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.repositories import evaluation_repo
from app.schemas.evaluation import (
    EvaluationCreateResponse,
    EvaluationHistoryItem,
    EvaluationResultResponse,
    EvaluationStatusResponse,
    FactorScoreResponse,
    LoanRangeEstimateResponse,
    ProofRecordSummary,
    StageProgress,
)
from app.services import evaluation_service

router = APIRouter(prefix="/api/v1/evaluations", tags=["evaluations"])

_STAGES = ["normalizing", "scoring", "explaining", "saving"]


@router.post("", response_model=EvaluationCreateResponse, status_code=201)
async def create_evaluation(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EvaluationCreateResponse:
    request = await evaluation_service.create_evaluation_request(
        db, user, celery_client.send_task
    )
    return EvaluationCreateResponse(
        id=request.public_id,
        status=request.status,
        requested_at=request.requested_at,
    )


@router.get("/history", response_model=list[EvaluationHistoryItem])
async def list_history(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[EvaluationHistoryItem]:
    requests = await evaluation_repo.list_requests_by_user(db, user.id)
    items = []
    for req in requests:
        ev_result = await evaluation_repo.get_result_by_request_id(db, req.id)
        items.append(
            EvaluationHistoryItem(
                id=req.public_id,
                status=req.status,
                total_score=float(ev_result.total_score) if ev_result else None,
                grade=ev_result.grade if ev_result else None,
                requested_at=req.requested_at,
                completed_at=req.completed_at,
            )
        )
    return items


@router.get("/{public_id}/status", response_model=EvaluationStatusResponse)
async def get_status(
    public_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EvaluationStatusResponse:
    request = await evaluation_repo.get_request_by_public_id(db, public_id)
    if request is None or request.user_id != user.id:
        raise HTTPException(status_code=404, detail="평가를 찾을 수 없습니다.")

    stage_progress = None
    if request.current_stage and request.current_stage in _STAGES:
        idx = _STAGES.index(request.current_stage)
        stage_progress = StageProgress(
            stages=_STAGES,
            current_index=idx,
            total=len(_STAGES),
        )

    return EvaluationStatusResponse(
        id=request.public_id,
        status=request.status,
        current_stage=request.current_stage,
        stage_progress=stage_progress,
        requested_at=request.requested_at,
        started_at=request.started_at,
        completed_at=request.completed_at,
        error_message=request.error_message,
    )


@router.get("/{public_id}/result", response_model=EvaluationResultResponse)
async def get_result(
    public_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EvaluationResultResponse:
    request = await evaluation_repo.get_request_by_public_id(db, public_id)
    if request is None or request.user_id != user.id:
        raise HTTPException(status_code=404, detail="평가를 찾을 수 없습니다.")

    if request.status != "completed":
        raise HTTPException(
            status_code=409,
            detail=f"평가가 아직 완료되지 않았습니다. 현재 상태: {request.status}",
        )

    ev_result = await evaluation_repo.get_result_by_request_id(db, request.id)
    if ev_result is None:
        raise HTTPException(status_code=404, detail="평가 결과를 찾을 수 없습니다.")

    proof = await evaluation_repo.get_proof_by_result_id(db, ev_result.id)

    return EvaluationResultResponse(
        id=request.public_id,
        status=request.status,
        total_score=float(ev_result.total_score),
        grade=ev_result.grade,
        confidence_level=float(ev_result.confidence_level),
        overall_summary=ev_result.overall_summary,
        strengths=ev_result.strengths,
        improvement_areas=ev_result.improvement_areas,
        risk_flags=ev_result.risk_flags,
        needs_human_review=ev_result.needs_human_review,
        factor_scores=[
            FactorScoreResponse(
                factor_name=fs.factor_name,
                score_value=float(fs.score_value),
                max_score=float(fs.max_score),
                reason_codes=fs.reason_codes,
                explanation=fs.explanation,
                confidence=float(fs.confidence),
            )
            for fs in ev_result.factor_scores
        ],
        loan_estimate=(
            LoanRangeEstimateResponse(
                range_min=ev_result.loan_estimate.range_min,
                range_max=ev_result.loan_estimate.range_max,
                rationale=ev_result.loan_estimate.rationale,
                disclaimer_text=ev_result.loan_estimate.disclaimer_text,
            )
            if ev_result.loan_estimate
            else None
        ),
        proof_record=(
            ProofRecordSummary(
                id=proof.public_id,
                proof_version=proof.proof_version,
                payload_hash_sha256=proof.payload_hash_sha256,
                issuer=proof.issuer,
                verification_status=proof.verification_status,
                created_at=proof.created_at,
            )
            if proof
            else None
        ),
        model_version=ev_result.model_version,
        scoring_config_version=ev_result.scoring_config_version,
        processing_time_ms=ev_result.processing_time_ms,
        completed_at=request.completed_at,
    )


@router.get("/{public_id}", response_model=EvaluationStatusResponse)
async def get_evaluation(
    public_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EvaluationStatusResponse:
    """Generic evaluation detail — delegates to status endpoint logic."""
    return await get_status(public_id, user, db)
