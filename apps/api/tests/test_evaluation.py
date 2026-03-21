"""Integration tests for the evaluation request / status / result / proof API."""

from unittest.mock import MagicMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import evaluation_repo


# ── Helpers ──
async def _signup_and_login(client: AsyncClient, email: str = "eval@example.com") -> dict[str, str]:
    await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "password123", "name": "평가테스터"},
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "password123"},
    )
    return {"X-CSRF-Token": resp.json()["csrf_token"]}


def _mock_send_task() -> MagicMock:
    """Return a mock Celery send_task that does nothing."""
    mock_task = MagicMock()
    mock_task.id = "mock-celery-task-id"
    mock = MagicMock(return_value=mock_task)
    return mock


# ── Tests ──
@pytest.mark.asyncio
async def test_create_evaluation_unauthenticated(client: AsyncClient) -> None:
    resp = await client.post("/api/v1/evaluations")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_create_evaluation_creates_snapshot(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Creating an evaluation should persist request + snapshot rows."""
    headers = await _signup_and_login(client)

    # Add some evidence first
    await client.put(
        "/api/v1/evidence/academic",
        json={"gpa": 3.8, "gpa_scale": "4.5", "university": "서울대", "major": "컴퓨터공학"},
        headers=headers,
    )

    with patch("app.routers.evaluation.celery_client") as mock_celery:
        mock_celery.send_task = _mock_send_task()
        resp = await client.post("/api/v1/evaluations", headers=headers)

    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "pending"
    assert "id" in data
    assert len(data["id"]) == 36  # UUID format

    # Verify snapshot was created in DB
    request = await evaluation_repo.get_request_by_public_id(db_session, data["id"])
    assert request is not None
    assert request.input_snapshot_hash is not None

    snapshot = await evaluation_repo.get_snapshot_by_request_id(db_session, request.id)
    assert snapshot is not None
    assert snapshot.scoring_config_version == "1.0.0"
    assert snapshot.payload_hash_sha256 == request.input_snapshot_hash


@pytest.mark.asyncio
async def test_get_status_pending(client: AsyncClient) -> None:
    headers = await _signup_and_login(client)

    with patch("app.routers.evaluation.celery_client") as mock_celery:
        mock_celery.send_task = _mock_send_task()
        create_resp = await client.post("/api/v1/evaluations", headers=headers)

    eval_id = create_resp.json()["id"]

    resp = await client.get(f"/api/v1/evaluations/{eval_id}/status", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "pending"
    assert data["id"] == eval_id
    assert data["stage_progress"] is None  # No stage set yet


@pytest.mark.asyncio
async def test_get_status_not_found(client: AsyncClient) -> None:
    headers = await _signup_and_login(client)
    resp = await client.get(
        "/api/v1/evaluations/00000000-0000-0000-0000-000000000000/status",
        headers=headers,
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_result_before_completion(client: AsyncClient) -> None:
    """Requesting result of pending evaluation should return 409."""
    headers = await _signup_and_login(client)

    with patch("app.routers.evaluation.celery_client") as mock_celery:
        mock_celery.send_task = _mock_send_task()
        create_resp = await client.post("/api/v1/evaluations", headers=headers)

    eval_id = create_resp.json()["id"]

    resp = await client.get(f"/api/v1/evaluations/{eval_id}/result", headers=headers)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_get_result_after_completion(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Simulate completion: write result rows directly, then verify API returns them."""
    headers = await _signup_and_login(client)

    with patch("app.routers.evaluation.celery_client") as mock_celery:
        mock_celery.send_task = _mock_send_task()
        create_resp = await client.post("/api/v1/evaluations", headers=headers)

    eval_id = create_resp.json()["id"]
    request = await evaluation_repo.get_request_by_public_id(db_session, eval_id)
    assert request is not None

    # Simulate worker: create result rows
    ev_result = await evaluation_repo.create_evaluation_result(
        db_session,
        evaluation_request_id=request.id,
        data={
            "total_score": 72.5,
            "grade": "B+",
            "confidence_level": 0.85,
            "overall_summary": "전반적으로 우수한 역량을 보유하고 있습니다.",
            "strengths": ["프로젝트 경험 풍부", "기술 스택 다양"],
            "improvement_areas": ["자격증 부족", "인턴십 경험 없음"],
            "risk_flags": [],
            "needs_human_review": False,
            "model_version": "anthropic:claude-sonnet-4-6",
            "scoring_config_version": "1.0.0",
            "raw_ai_response": {"test": True},
            "processing_time_ms": 1500,
        },
    )

    # Factor scores
    factor_data = [
        ("academic", 11.0, 15.0),
        ("project", 20.0, 25.0),
        ("internship", 12.0, 20.0),
        ("certification", 7.0, 10.0),
        ("portfolio", 10.0, 15.0),
        ("github", 8.0, 10.0),
        ("consistency", 4.5, 5.0),
    ]
    for name, score, max_score in factor_data:
        await evaluation_repo.create_factor_score(
            db_session,
            evaluation_result_id=ev_result.id,
            data={
                "factor_name": name,
                "score_value": score,
                "max_score": max_score,
                "reason_codes": ["TEST"],
                "explanation": f"{name} 설명",
                "confidence": 0.8,
            },
        )

    # Loan estimate
    await evaluation_repo.create_loan_estimate(
        db_session,
        evaluation_result_id=ev_result.id,
        data={
            "range_min": 15_000_000,
            "range_max": 30_000_000,
            "rationale": "B+등급 기준 예상 범위",
            "disclaimer_text": "본 결과는 시뮬레이션입니다.",
        },
    )

    # Mark request as completed
    request.status = "completed"
    from datetime import datetime
    request.completed_at = datetime.utcnow()
    await db_session.commit()

    # Now fetch result via API
    resp = await client.get(f"/api/v1/evaluations/{eval_id}/result", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_score"] == 72.5
    assert data["grade"] == "B+"
    assert len(data["factor_scores"]) == 7
    assert data["loan_estimate"] is not None
    assert data["loan_estimate"]["range_min"] == 15_000_000


@pytest.mark.asyncio
async def test_evaluation_history_empty(client: AsyncClient) -> None:
    headers = await _signup_and_login(client, "history@example.com")
    resp = await client.get("/api/v1/evaluations/history", headers=headers)
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_evaluation_ownership(client: AsyncClient) -> None:
    """User B cannot access User A's evaluation."""
    headers_a = await _signup_and_login(client, "owner_eval_a@example.com")

    with patch("app.routers.evaluation.celery_client") as mock_celery:
        mock_celery.send_task = _mock_send_task()
        create_resp = await client.post("/api/v1/evaluations", headers=headers_a)

    eval_id = create_resp.json()["id"]

    # Log in as user B
    headers_b = await _signup_and_login(client, "owner_eval_b@example.com")

    resp = await client.get(f"/api/v1/evaluations/{eval_id}/status", headers=headers_b)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_proof_record_verify(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Creating a proof record and verifying it should return valid=True."""
    headers = await _signup_and_login(client)

    with patch("app.routers.evaluation.celery_client") as mock_celery:
        mock_celery.send_task = _mock_send_task()
        create_resp = await client.post("/api/v1/evaluations", headers=headers)

    eval_id = create_resp.json()["id"]
    request = await evaluation_repo.get_request_by_public_id(db_session, eval_id)
    assert request is not None

    # Create result
    ev_result = await evaluation_repo.create_evaluation_result(
        db_session,
        evaluation_request_id=request.id,
        data={
            "total_score": 80.0,
            "grade": "A",
            "confidence_level": 0.9,
            "overall_summary": "우수",
            "strengths": ["강점"],
            "improvement_areas": ["개선"],
            "risk_flags": [],
            "needs_human_review": False,
            "model_version": "test",
            "scoring_config_version": "1.0.0",
            "raw_ai_response": {},
            "processing_time_ms": 0,
        },
    )

    # Create proof record with canonical JSON
    from app.utils.canonical_json import canonical_json_v1, compute_hash

    proof_payload = {"score": 80.0, "grade": "A", "evidence_hash": "abc123"}
    canonical = canonical_json_v1(proof_payload)
    proof_hash = compute_hash(canonical)
    import json

    proof = await evaluation_repo.create_proof_record(
        db_session,
        evaluation_result_id=ev_result.id,
        canonical_payload_json=json.loads(canonical),
        payload_hash_sha256=proof_hash,
        evidence_combined_hash="abc123",
    )
    await db_session.commit()

    # Retrieve proof record
    resp = await client.get(f"/api/v1/proof-records/{proof.public_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["verification_status"] == "issued"
    assert data["payload_hash_sha256"] == proof_hash

    # Verify integrity
    resp = await client.post(f"/api/v1/proof-records/{proof.public_id}/verify")
    assert resp.status_code == 200
    verify_data = resp.json()
    assert verify_data["valid"] is True
    assert verify_data["computed_hash"] == verify_data["stored_hash"]
