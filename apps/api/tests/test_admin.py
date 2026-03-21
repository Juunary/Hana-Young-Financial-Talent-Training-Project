"""Admin API integration tests."""

from unittest.mock import MagicMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import evaluation_repo
from app.repositories import user_repo


# ── Helpers ──
async def _create_user(
    client: AsyncClient,
    email: str = "admin@example.com",
    role: str = "user",
    db: AsyncSession | None = None,
) -> dict[str, str]:
    """Sign up a user and optionally promote role via DB."""
    await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "password123", "name": "테스트"},
    )
    if role != "user" and db is not None:
        user = await user_repo.get_by_email(db, email)
        if user:
            user.role = role
            await db.commit()

    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "password123"},
    )
    return {"X-CSRF-Token": resp.json()["csrf_token"]}


def _mock_send_task() -> MagicMock:
    mock_task = MagicMock()
    mock_task.id = "mock-celery-task-id"
    return MagicMock(return_value=mock_task)


# ── Auth checks ──
@pytest.mark.asyncio
async def test_admin_requires_auth(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/admin/dashboard")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_admin_requires_admin_role(client: AsyncClient, db_session: AsyncSession) -> None:
    headers = await _create_user(client, "plain@example.com", role="user", db=db_session)
    resp = await client.get("/api/v1/admin/dashboard", headers=headers)
    assert resp.status_code == 403


# ── Dashboard ──
@pytest.mark.asyncio
async def test_admin_dashboard(client: AsyncClient, db_session: AsyncSession) -> None:
    headers = await _create_user(
        client, "admin2@example.com", role="admin", db=db_session
    )
    resp = await client.get("/api/v1/admin/dashboard", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "total_evaluations" in data
    assert "total_users" in data
    assert data["total_evaluations"] == 0


# ── Evaluation list ──
@pytest.mark.asyncio
async def test_admin_list_evaluations_empty(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    headers = await _create_user(client, "adminlist@example.com", role="admin", db=db_session)
    resp = await client.get("/api/v1/admin/evaluations", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["items"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_admin_list_evaluations_with_data(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    # Create a regular user and request an evaluation
    user_headers = await _create_user(client, "user_for_admin@example.com", db=db_session)
    with patch("app.routers.evaluation.celery_client") as mock_celery:
        mock_celery.send_task = _mock_send_task()
        resp = await client.post("/api/v1/evaluations", headers=user_headers)
    assert resp.status_code == 201
    eval_id = resp.json()["id"]

    # Admin sees it
    admin_headers = await _create_user(
        client, "adminview@example.com", role="admin", db=db_session
    )
    resp = await client.get("/api/v1/admin/evaluations", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["id"] == eval_id


# ── Evaluation detail ──
@pytest.mark.asyncio
async def test_admin_evaluation_detail(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    user_headers = await _create_user(client, "userdetail@example.com", db=db_session)
    with patch("app.routers.evaluation.celery_client") as mock_celery:
        mock_celery.send_task = _mock_send_task()
        resp = await client.post("/api/v1/evaluations", headers=user_headers)
    eval_id = resp.json()["id"]

    admin_headers = await _create_user(
        client, "admindetail@example.com", role="admin", db=db_session
    )
    resp = await client.get(f"/api/v1/admin/evaluations/{eval_id}", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == eval_id
    assert data["status"] == "pending"
    assert "snapshot_evidence" in data
    assert "reviewer_notes" in data


# ── Reviewer cannot see unassigned evaluation ──
@pytest.mark.asyncio
async def test_reviewer_cannot_access_unassigned(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    user_headers = await _create_user(client, "userunassigned@example.com", db=db_session)
    with patch("app.routers.evaluation.celery_client") as mock_celery:
        mock_celery.send_task = _mock_send_task()
        resp = await client.post("/api/v1/evaluations", headers=user_headers)
    eval_id = resp.json()["id"]

    reviewer_headers = await _create_user(
        client, "reviewer1@example.com", role="reviewer", db=db_session
    )
    resp = await client.get(
        f"/api/v1/admin/evaluations/{eval_id}", headers=reviewer_headers
    )
    assert resp.status_code == 403


# ── Assign reviewer ──
@pytest.mark.asyncio
async def test_admin_assign_reviewer(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    user_headers = await _create_user(client, "userassign@example.com", db=db_session)
    with patch("app.routers.evaluation.celery_client") as mock_celery:
        mock_celery.send_task = _mock_send_task()
        resp = await client.post("/api/v1/evaluations", headers=user_headers)
    eval_id = resp.json()["id"]

    # Create reviewer
    await _create_user(client, "reviewer2@example.com", role="reviewer", db=db_session)
    reviewer = await user_repo.get_by_email(db_session, "reviewer2@example.com")
    assert reviewer is not None

    admin_headers = await _create_user(
        client, "adminassign@example.com", role="admin", db=db_session
    )
    resp = await client.post(
        f"/api/v1/admin/evaluations/{eval_id}/assign",
        json={"reviewer_id": reviewer.id},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["reviewer_id"] == reviewer.id
    assert data["review_status"] == "assigned"


# ── Reviewer can access after assignment ──
@pytest.mark.asyncio
async def test_reviewer_can_access_after_assignment(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    user_headers = await _create_user(client, "userafterassign@example.com", db=db_session)
    with patch("app.routers.evaluation.celery_client") as mock_celery:
        mock_celery.send_task = _mock_send_task()
        resp = await client.post("/api/v1/evaluations", headers=user_headers)
    eval_id = resp.json()["id"]

    await _create_user(client, "reviewer3@example.com", role="reviewer", db=db_session)
    reviewer = await user_repo.get_by_email(db_session, "reviewer3@example.com")
    assert reviewer is not None

    admin_headers = await _create_user(
        client, "adminaccess@example.com", role="admin", db=db_session
    )
    await client.post(
        f"/api/v1/admin/evaluations/{eval_id}/assign",
        json={"reviewer_id": reviewer.id},
        headers=admin_headers,
    )

    # Now reviewer can access
    reviewer_headers = await _create_user(
        client, "reviewer3@example.com", db=db_session
    )
    resp = await client.get(
        f"/api/v1/admin/evaluations/{eval_id}", headers=reviewer_headers
    )
    assert resp.status_code == 200


# ── Submit review ──
@pytest.mark.asyncio
async def test_admin_submit_review(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    user_headers = await _create_user(client, "userreview@example.com", db=db_session)
    with patch("app.routers.evaluation.celery_client") as mock_celery:
        mock_celery.send_task = _mock_send_task()
        resp = await client.post("/api/v1/evaluations", headers=user_headers)
    eval_id = resp.json()["id"]

    admin_headers = await _create_user(
        client, "adminreview@example.com", role="admin", db=db_session
    )
    resp = await client.post(
        f"/api/v1/admin/evaluations/{eval_id}/review",
        json={"comment": "검토 완료. 데이터 품질 양호합니다.", "status_change": "reviewed"},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["comment"] == "검토 완료. 데이터 품질 양호합니다."
    assert data["status_change"] == "reviewed"

    # Note appears in detail
    resp = await client.get(f"/api/v1/admin/evaluations/{eval_id}", headers=admin_headers)
    assert len(resp.json()["reviewer_notes"]) == 1


# ── Review queue ──
@pytest.mark.asyncio
async def test_review_queue_empty(client: AsyncClient, db_session: AsyncSession) -> None:
    admin_headers = await _create_user(
        client, "adminqueue@example.com", role="admin", db=db_session
    )
    resp = await client.get("/api/v1/admin/review-queue", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["items"] == []


# ── Audit logs ──
@pytest.mark.asyncio
async def test_audit_logs_empty(client: AsyncClient, db_session: AsyncSession) -> None:
    admin_headers = await _create_user(
        client, "adminaudit@example.com", role="admin", db=db_session
    )
    resp = await client.get("/api/v1/admin/audit-logs", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


# ── Regular user cannot access admin endpoints ──
@pytest.mark.asyncio
async def test_user_cannot_access_review_queue(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    headers = await _create_user(client, "userqueue@example.com", db=db_session)
    resp = await client.get("/api/v1/admin/review-queue", headers=headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_user_cannot_access_audit_logs(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    headers = await _create_user(client, "useraudit@example.com", db=db_session)
    resp = await client.get("/api/v1/admin/audit-logs", headers=headers)
    assert resp.status_code == 403
