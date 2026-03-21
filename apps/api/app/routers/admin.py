"""Admin API — requires admin or reviewer role."""

import math

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_admin_or_reviewer_user, get_admin_user
from app.models.user import User
from app.repositories import admin_repo, evaluation_repo, user_repo
from app.schemas.admin import (
    AdminDashboardStats,
    AdminEvaluationDetail,
    AdminEvaluationListItem,
    AdminEvaluationListResponse,
    AdminFactorScore,
    AdminLoanEstimate,
    AdminReviewerNote,
    AssignRequest,
    AssignResponse,
    AuditLogItem,
    AuditLogResponse,
    ReviewSubmitRequest,
    ReviewSubmitResponse,
)

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


# ── Helper ──
async def _require_admin_evaluation(
    public_id: str,
    user: User,
    db: AsyncSession,
):
    """Load evaluation and enforce access: admin sees all, reviewer sees assigned only."""
    req = await admin_repo.get_evaluation_with_details(db, public_id)
    if req is None:
        raise HTTPException(status_code=404, detail="평가를 찾을 수 없습니다.")

    if user.role == "reviewer":
        assignment = await admin_repo.get_active_assignment(db, req.id, user.id)
        if not assignment:
            raise HTTPException(status_code=403, detail="이 평가에 접근 권한이 없습니다.")

    return req


# ── Dashboard ──
@router.get("/dashboard", response_model=AdminDashboardStats)
async def admin_dashboard(
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
) -> AdminDashboardStats:
    stats = await admin_repo.get_dashboard_stats(db)
    return AdminDashboardStats(**stats)


# ── Evaluation list ──
@router.get("/evaluations", response_model=AdminEvaluationListResponse)
async def list_evaluations(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: str | None = Query(None),
    needs_review: bool | None = Query(None),
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
) -> AdminEvaluationListResponse:
    requests, total = await admin_repo.list_evaluations(
        db, page=page, per_page=per_page, status=status, needs_review=needs_review
    )

    items = []
    for req in requests:
        ev_user = await user_repo.get_by_id(db, req.user_id)
        ev_result = req.result  # loaded via selectinload
        items.append(
            AdminEvaluationListItem(
                id=req.public_id,
                user_id=req.user_id,
                user_email=ev_user.email if ev_user else None,
                status=req.status,
                total_score=float(ev_result.total_score) if ev_result else None,
                grade=ev_result.grade if ev_result else None,
                needs_human_review=ev_result.needs_human_review if ev_result else False,
                requested_at=req.requested_at,
                completed_at=req.completed_at,
            )
        )

    return AdminEvaluationListResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=math.ceil(total / per_page) if total > 0 else 1,
    )


# ── Evaluation detail ──
@router.get("/evaluations/{public_id}", response_model=AdminEvaluationDetail)
async def get_evaluation_detail(
    public_id: str,
    user: User = Depends(get_admin_or_reviewer_user),
    db: AsyncSession = Depends(get_db),
) -> AdminEvaluationDetail:
    req = await _require_admin_evaluation(public_id, user, db)
    ev_user = await user_repo.get_by_id(db, req.user_id)
    ev_result = req.result
    snapshot = req.input_snapshot

    notes_raw = await admin_repo.list_reviewer_notes(db, req.id)
    notes = []
    for n in notes_raw:
        n_user = await user_repo.get_by_id(db, n.reviewer_id)
        notes.append(
            AdminReviewerNote(
                id=n.id,
                reviewer_id=n.reviewer_id,
                reviewer_email=n_user.email if n_user else None,
                status_change=n.status_change,
                comment=n.comment,
                created_at=n.created_at,
            )
        )

    return AdminEvaluationDetail(
        id=req.public_id,
        user_id=req.user_id,
        user_email=ev_user.email if ev_user else None,
        status=req.status,
        current_stage=req.current_stage,
        requested_at=req.requested_at,
        completed_at=req.completed_at,
        error_message=req.error_message,
        input_snapshot_hash=req.input_snapshot_hash,
        total_score=float(ev_result.total_score) if ev_result else None,
        grade=ev_result.grade if ev_result else None,
        confidence_level=float(ev_result.confidence_level) if ev_result else None,
        overall_summary=ev_result.overall_summary if ev_result else None,
        strengths=ev_result.strengths if ev_result else [],
        improvement_areas=ev_result.improvement_areas if ev_result else [],
        risk_flags=ev_result.risk_flags if ev_result else [],
        needs_human_review=ev_result.needs_human_review if ev_result else False,
        factor_scores=[
            AdminFactorScore(
                factor_name=fs.factor_name,
                score_value=float(fs.score_value),
                max_score=float(fs.max_score),
                reason_codes=fs.reason_codes,
                explanation=fs.explanation,
                confidence=float(fs.confidence),
            )
            for fs in (ev_result.factor_scores if ev_result else [])
        ],
        loan_estimate=(
            AdminLoanEstimate(
                range_min=ev_result.loan_estimate.range_min,
                range_max=ev_result.loan_estimate.range_max,
                rationale=ev_result.loan_estimate.rationale,
                disclaimer_text=ev_result.loan_estimate.disclaimer_text,
            )
            if ev_result and ev_result.loan_estimate
            else None
        ),
        snapshot_evidence=snapshot.snapshot_payload if snapshot else None,
        snapshot_scoring_config_version=(
            snapshot.scoring_config_version if snapshot else None
        ),
        snapshot_model_version=snapshot.model_version if snapshot else None,
        raw_ai_response=ev_result.raw_ai_response if ev_result else None,
        reviewer_notes=notes,
    )


# ── Submit review ──
@router.post("/evaluations/{public_id}/review", response_model=ReviewSubmitResponse)
async def submit_review(
    public_id: str,
    body: ReviewSubmitRequest,
    user: User = Depends(get_admin_or_reviewer_user),
    db: AsyncSession = Depends(get_db),
) -> ReviewSubmitResponse:
    req = await _require_admin_evaluation(public_id, user, db)

    # Find active assignment (for reviewer; admin can always review)
    assignment_id: int | None = None
    if user.role == "reviewer":
        assignment = await admin_repo.get_active_assignment(db, req.id, user.id)
        if assignment:
            assignment_id = assignment.id

    note = await admin_repo.create_reviewer_note(
        db,
        evaluation_request_id=req.id,
        reviewer_id=user.id,
        comment=body.comment,
        status_change=body.status_change,
        assignment_id=assignment_id,
    )
    await db.commit()

    return ReviewSubmitResponse(
        id=note.id,
        evaluation_request_id=req.public_id,
        reviewer_id=note.reviewer_id,
        status_change=note.status_change,
        comment=note.comment,
        created_at=note.created_at,
    )


# ── Assign reviewer ──
@router.post("/evaluations/{public_id}/assign", response_model=AssignResponse)
async def assign_reviewer(
    public_id: str,
    body: AssignRequest,
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
) -> AssignResponse:
    req = await evaluation_repo.get_request_by_public_id(db, public_id)
    if req is None:
        raise HTTPException(status_code=404, detail="평가를 찾을 수 없습니다.")

    reviewer = await user_repo.get_by_id(db, body.reviewer_id)
    if reviewer is None or reviewer.role not in ("reviewer", "admin"):
        raise HTTPException(status_code=422, detail="유효한 심사자 ID가 아닙니다.")

    assignment = await admin_repo.create_assignment(
        db,
        evaluation_request_id=req.id,
        reviewer_id=body.reviewer_id,
        assigned_by_id=user.id,
    )
    await db.commit()

    return AssignResponse(
        id=assignment.id,
        evaluation_request_id=req.public_id,
        reviewer_id=assignment.reviewer_id,
        assigned_by_id=assignment.assigned_by_id,
        review_status=assignment.review_status,
        assigned_at=assignment.assigned_at,
    )


# ── Review queue ──
@router.get("/review-queue", response_model=AdminEvaluationListResponse)
async def review_queue(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: User = Depends(get_admin_or_reviewer_user),
    db: AsyncSession = Depends(get_db),
) -> AdminEvaluationListResponse:
    """Evaluations that need human review."""
    requests, total = await admin_repo.list_evaluations(
        db, page=page, per_page=per_page, needs_review=True
    )

    items = []
    for req in requests:
        # Reviewer: only show assigned evaluations
        if user.role == "reviewer":
            assignment = await admin_repo.get_active_assignment(db, req.id, user.id)
            if not assignment:
                continue

        ev_user = await user_repo.get_by_id(db, req.user_id)
        ev_result = req.result
        items.append(
            AdminEvaluationListItem(
                id=req.public_id,
                user_id=req.user_id,
                user_email=ev_user.email if ev_user else None,
                status=req.status,
                total_score=float(ev_result.total_score) if ev_result else None,
                grade=ev_result.grade if ev_result else None,
                needs_human_review=True,
                requested_at=req.requested_at,
                completed_at=req.completed_at,
            )
        )

    return AdminEvaluationListResponse(
        items=items,
        total=len(items),
        page=page,
        per_page=per_page,
        total_pages=math.ceil(total / per_page) if total > 0 else 1,
    )


# ── Audit logs ──
@router.get("/audit-logs", response_model=AuditLogResponse)
async def list_audit_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    event_name: str | None = Query(None),
    actor_id: int | None = Query(None),
    user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
) -> AuditLogResponse:
    logs, total = await admin_repo.list_audit_logs(
        db, page=page, per_page=per_page, event_name=event_name, actor_id=actor_id
    )

    return AuditLogResponse(
        items=[
            AuditLogItem(
                id=log.id,
                actor_type=log.actor_type,
                actor_id=log.actor_id,
                event_name=log.event_name,
                event_payload_json=log.event_payload_json,
                resource_type=log.resource_type,
                resource_id=log.resource_id,
                ip_address=log.ip_address,
                created_at=log.created_at,
            )
            for log in logs
        ],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=math.ceil(total / per_page) if total > 0 else 1,
    )
