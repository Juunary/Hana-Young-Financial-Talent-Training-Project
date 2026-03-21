"""Admin-specific repository queries."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import contains_eager, selectinload

from app.models.audit import AuditLog
from app.models.evaluation import (
    EvaluationAssignment,
    EvaluationInputSnapshot,
    EvaluationRequest,
    EvaluationResult,
    ReviewerNote,
)
from app.models.user import User


# ── Evaluation list (paginated) ──
async def list_evaluations(
    db: AsyncSession,
    *,
    page: int = 1,
    per_page: int = 20,
    status: str | None = None,
    needs_review: bool | None = None,
) -> tuple[list[EvaluationRequest], int]:
    query = (
        select(EvaluationRequest)
        .options(selectinload(EvaluationRequest.result))
        .order_by(EvaluationRequest.requested_at.desc())
    )

    if status:
        query = query.where(EvaluationRequest.status == status)

    if needs_review:
        query = query.join(
            EvaluationResult,
            EvaluationResult.evaluation_request_id == EvaluationRequest.id,
        ).where(EvaluationResult.needs_human_review == True)  # noqa: E712

    count_query = select(func.count()).select_from(
        select(EvaluationRequest)
        .where(*([EvaluationRequest.status == status] if status else []))
        .subquery()
    )
    if needs_review:
        count_query = select(func.count()).select_from(
            select(EvaluationRequest)
            .join(
                EvaluationResult,
                EvaluationResult.evaluation_request_id == EvaluationRequest.id,
            )
            .where(EvaluationResult.needs_human_review == True)  # noqa: E712
            .subquery()
        )

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    offset = (page - 1) * per_page
    paginated = query.offset(offset).limit(per_page)
    rows = await db.execute(paginated)
    return list(rows.scalars().all()), total


async def get_evaluation_with_details(
    db: AsyncSession, public_id: str
) -> EvaluationRequest | None:
    """Load an evaluation request with result + factor scores + snapshot."""
    result = await db.execute(
        select(EvaluationRequest)
        .where(EvaluationRequest.public_id == public_id)
        .options(
            selectinload(EvaluationRequest.result).options(
                selectinload(EvaluationResult.factor_scores),
                selectinload(EvaluationResult.loan_estimate),
                selectinload(EvaluationResult.proof_record),
            ),
            selectinload(EvaluationRequest.input_snapshot),
        )
    )
    return result.scalar_one_or_none()


# ── Reviewer notes ──
async def list_reviewer_notes(
    db: AsyncSession, evaluation_request_id: int
) -> list[ReviewerNote]:
    result = await db.execute(
        select(ReviewerNote)
        .where(ReviewerNote.evaluation_request_id == evaluation_request_id)
        .order_by(ReviewerNote.created_at.asc())
    )
    return list(result.scalars().all())


async def create_reviewer_note(
    db: AsyncSession,
    evaluation_request_id: int,
    reviewer_id: int,
    comment: str,
    status_change: str | None,
    assignment_id: int | None = None,
) -> ReviewerNote:
    note = ReviewerNote(
        evaluation_request_id=evaluation_request_id,
        reviewer_id=reviewer_id,
        assignment_id=assignment_id,
        comment=comment,
        status_change=status_change,
    )
    db.add(note)
    await db.flush()
    await db.refresh(note)
    return note


# ── Assignments ──
async def get_active_assignment(
    db: AsyncSession, evaluation_request_id: int, reviewer_id: int
) -> EvaluationAssignment | None:
    result = await db.execute(
        select(EvaluationAssignment)
        .where(
            EvaluationAssignment.evaluation_request_id == evaluation_request_id,
            EvaluationAssignment.reviewer_id == reviewer_id,
            EvaluationAssignment.review_status != "reassigned",
        )
    )
    return result.scalar_one_or_none()


async def create_assignment(
    db: AsyncSession,
    evaluation_request_id: int,
    reviewer_id: int,
    assigned_by_id: int,
) -> EvaluationAssignment:
    assignment = EvaluationAssignment(
        evaluation_request_id=evaluation_request_id,
        reviewer_id=reviewer_id,
        assigned_by_id=assigned_by_id,
    )
    db.add(assignment)
    await db.flush()
    await db.refresh(assignment)
    return assignment


# ── Snapshot ──
async def get_snapshot(
    db: AsyncSession, evaluation_request_id: int
) -> EvaluationInputSnapshot | None:
    result = await db.execute(
        select(EvaluationInputSnapshot).where(
            EvaluationInputSnapshot.evaluation_request_id == evaluation_request_id
        )
    )
    return result.scalar_one_or_none()


# ── Audit logs (paginated) ──
async def list_audit_logs(
    db: AsyncSession,
    *,
    page: int = 1,
    per_page: int = 50,
    event_name: str | None = None,
    actor_id: int | None = None,
) -> tuple[list[AuditLog], int]:
    query = select(AuditLog).order_by(AuditLog.created_at.desc())

    if event_name:
        query = query.where(AuditLog.event_name == event_name)
    if actor_id is not None:
        query = query.where(AuditLog.actor_id == actor_id)

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    offset = (page - 1) * per_page
    rows = await db.execute(query.offset(offset).limit(per_page))
    return list(rows.scalars().all()), total


# ── Dashboard stats ──
async def get_dashboard_stats(db: AsyncSession) -> dict:  # type: ignore[type-arg]
    total = (
        await db.execute(select(func.count()).select_from(EvaluationRequest))
    ).scalar_one()

    def _status_count(status: str) -> int:
        return 0  # populated below

    statuses = {}
    for st in ("pending", "processing", "completed", "failed"):
        cnt = (
            await db.execute(
                select(func.count())
                .select_from(EvaluationRequest)
                .where(EvaluationRequest.status == st)
            )
        ).scalar_one()
        statuses[st] = cnt

    needs_review = (
        await db.execute(
            select(func.count())
            .select_from(EvaluationResult)
            .where(EvaluationResult.needs_human_review == True)  # noqa: E712
        )
    ).scalar_one()

    total_users = (
        await db.execute(
            select(func.count())
            .select_from(User)
            .where(User.role == "user")
        )
    ).scalar_one()

    return {
        "total_evaluations": total,
        "pending_count": statuses["pending"],
        "processing_count": statuses["processing"],
        "completed_count": statuses["completed"],
        "failed_count": statuses["failed"],
        "needs_review_count": needs_review,
        "total_users": total_users,
    }
