import pytest
from httpx import AsyncClient


# ── Helpers ──
async def _signup_and_login(client: AsyncClient, email: str = "ev@example.com") -> dict[str, str]:
    await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "password123", "name": "테스트"},
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "password123"},
    )
    return {"X-CSRF-Token": resp.json()["csrf_token"]}


# ── Summary ──
@pytest.mark.asyncio
async def test_evidence_summary_empty(client: AsyncClient) -> None:
    headers = await _signup_and_login(client)
    resp = await client.get("/api/v1/evidence/summary", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_categories"] == 8
    assert data["total_categories_with_data"] == 0
    assert all(c["count"] == 0 for c in data["categories"])


@pytest.mark.asyncio
async def test_evidence_summary_unauthenticated(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/evidence/summary")
    assert resp.status_code == 401


# ── Academic ──
@pytest.mark.asyncio
async def test_academic_get_empty(client: AsyncClient) -> None:
    headers = await _signup_and_login(client)
    resp = await client.get("/api/v1/evidence/academic", headers=headers)
    assert resp.status_code == 200
    assert resp.json() is None


@pytest.mark.asyncio
async def test_academic_upsert(client: AsyncClient) -> None:
    headers = await _signup_and_login(client)

    resp = await client.put(
        "/api/v1/evidence/academic",
        json={"gpa": 4.0, "gpa_scale": "4.5", "university": "서울대", "major": "컴퓨터공학"},
        headers=headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["gpa"] == 4.0
    assert data["university"] == "서울대"

    # Update same record
    resp2 = await client.put(
        "/api/v1/evidence/academic",
        json={"gpa": 4.2, "gpa_scale": "4.5"},
        headers=headers,
    )
    assert resp2.status_code == 200
    assert resp2.json()["gpa"] == 4.2


@pytest.mark.asyncio
async def test_academic_invalid_gpa(client: AsyncClient) -> None:
    headers = await _signup_and_login(client)
    resp = await client.put(
        "/api/v1/evidence/academic",
        json={"gpa": 5.0, "gpa_scale": "4.5"},
        headers=headers,
    )
    assert resp.status_code == 422


# ── Projects ──
@pytest.mark.asyncio
async def test_projects_crud(client: AsyncClient) -> None:
    headers = await _signup_and_login(client)

    # Empty list
    resp = await client.get("/api/v1/evidence/projects", headers=headers)
    assert resp.status_code == 200
    assert resp.json() == []

    # Create
    resp = await client.post(
        "/api/v1/evidence/projects",
        json={
            "title": "AI 프로젝트",
            "role": "백엔드 개발",
            "description": "FastAPI 기반 API 서버",
            "tech_stack": ["Python", "FastAPI"],
        },
        headers=headers,
    )
    assert resp.status_code == 201
    project_id = resp.json()["id"]
    assert resp.json()["title"] == "AI 프로젝트"
    assert resp.json()["tech_stack"] == ["Python", "FastAPI"]

    # List has 1
    resp = await client.get("/api/v1/evidence/projects", headers=headers)
    assert len(resp.json()) == 1

    # Update
    resp = await client.put(
        f"/api/v1/evidence/projects/{project_id}",
        json={"title": "AI 프로젝트 v2"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "AI 프로젝트 v2"

    # Delete
    resp = await client.delete(f"/api/v1/evidence/projects/{project_id}", headers=headers)
    assert resp.status_code == 204

    resp = await client.get("/api/v1/evidence/projects", headers=headers)
    assert resp.json() == []


@pytest.mark.asyncio
async def test_project_not_found(client: AsyncClient) -> None:
    headers = await _signup_and_login(client)
    resp = await client.put(
        "/api/v1/evidence/projects/9999",
        json={"title": "없음"},
        headers=headers,
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_project_ownership(client: AsyncClient) -> None:
    """User B cannot modify User A's projects (ownership check)."""
    # Log in as A and create project while A's session cookie is active
    headers_a = await _signup_and_login(client, "owner_a@example.com")
    resp = await client.post(
        "/api/v1/evidence/projects",
        json={"title": "A의 프로젝트", "role": "개발자", "description": ""},
        headers=headers_a,
    )
    assert resp.status_code == 201
    project_id = resp.json()["id"]

    # Log in as B (cookie jar now holds B's session)
    headers_b = await _signup_and_login(client, "owner_b@example.com")
    resp = await client.put(
        f"/api/v1/evidence/projects/{project_id}",
        json={"title": "B가 수정 시도"},
        headers=headers_b,
    )
    assert resp.status_code == 404  # Ownership enforced


# ── Internships ──
@pytest.mark.asyncio
async def test_internships_crud(client: AsyncClient) -> None:
    headers = await _signup_and_login(client)

    resp = await client.post(
        "/api/v1/evidence/internships",
        json={"company": "카카오", "position": "개발 인턴", "description": "백엔드 개발"},
        headers=headers,
    )
    assert resp.status_code == 201
    record_id = resp.json()["id"]
    assert resp.json()["company"] == "카카오"

    resp = await client.get("/api/v1/evidence/internships", headers=headers)
    assert len(resp.json()) == 1

    resp = await client.delete(f"/api/v1/evidence/internships/{record_id}", headers=headers)
    assert resp.status_code == 204


# ── Certifications ──
@pytest.mark.asyncio
async def test_certifications_crud(client: AsyncClient) -> None:
    headers = await _signup_and_login(client)

    resp = await client.post(
        "/api/v1/evidence/certifications",
        json={"name": "정보처리기사", "issuer": "한국산업인력공단"},
        headers=headers,
    )
    assert resp.status_code == 201
    record_id = resp.json()["id"]

    resp = await client.put(
        f"/api/v1/evidence/certifications/{record_id}",
        json={"name": "정보처리기사 (갱신)"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "정보처리기사 (갱신)"

    resp = await client.delete(f"/api/v1/evidence/certifications/{record_id}", headers=headers)
    assert resp.status_code == 204


# ── Education ──
@pytest.mark.asyncio
async def test_education_crud(client: AsyncClient) -> None:
    headers = await _signup_and_login(client)

    resp = await client.post(
        "/api/v1/evidence/education",
        json={
            "institution": "패스트캠퍼스",
            "course_name": "파이썬 머신러닝",
            "category": "bootcamp",
        },
        headers=headers,
    )
    assert resp.status_code == 201
    assert resp.json()["institution"] == "패스트캠퍼스"


# ── Portfolio ──
@pytest.mark.asyncio
async def test_portfolio_replace(client: AsyncClient) -> None:
    headers = await _signup_and_login(client)

    resp = await client.put(
        "/api/v1/evidence/portfolio",
        json={
            "links": [
                {"title": "GitHub", "url": "https://github.com/test"},
                {"title": "블로그", "url": "https://blog.test.com"},
            ]
        },
        headers=headers,
    )
    assert resp.status_code == 200
    assert len(resp.json()) == 2

    # Replace → 1 link
    resp = await client.put(
        "/api/v1/evidence/portfolio",
        json={"links": [{"title": "GitHub", "url": "https://github.com/test"}]},
        headers=headers,
    )
    assert resp.status_code == 200
    assert len(resp.json()) == 1


@pytest.mark.asyncio
async def test_portfolio_empty_clears(client: AsyncClient) -> None:
    headers = await _signup_and_login(client)

    await client.put(
        "/api/v1/evidence/portfolio",
        json={"links": [{"title": "Test", "url": "https://test.com"}]},
        headers=headers,
    )
    resp = await client.put(
        "/api/v1/evidence/portfolio",
        json={"links": []},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json() == []


# ── GitHub ──
@pytest.mark.asyncio
async def test_github_upsert(client: AsyncClient) -> None:
    headers = await _signup_and_login(client)

    resp = await client.put(
        "/api/v1/evidence/github",
        json={"username": "octocat"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["username"] == "octocat"
    assert resp.json()["profile_url"] == "https://github.com/octocat"

    # Update username
    resp = await client.put(
        "/api/v1/evidence/github",
        json={"username": "newname"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["username"] == "newname"


# ── Summary after data ──
@pytest.mark.asyncio
async def test_evidence_summary_after_data(client: AsyncClient) -> None:
    headers = await _signup_and_login(client)

    await client.put(
        "/api/v1/evidence/academic",
        json={"gpa": 3.8, "gpa_scale": "4.5"},
        headers=headers,
    )
    await client.post(
        "/api/v1/evidence/projects",
        json={"title": "프로젝트", "role": "개발자", "description": ""},
        headers=headers,
    )

    resp = await client.get("/api/v1/evidence/summary", headers=headers)
    data = resp.json()
    assert data["total_categories_with_data"] == 2
    academic = next(c for c in data["categories"] if c["category"] == "academic")
    assert academic["has_data"] is True
    assert academic["count"] == 1
