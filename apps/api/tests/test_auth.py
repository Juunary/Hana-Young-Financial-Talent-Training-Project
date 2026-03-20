import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_signup_success(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": "test@example.com", "password": "password123", "name": "테스트"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "test@example.com"
    assert "id" in data
    assert "session_id" in resp.cookies


@pytest.mark.asyncio
async def test_signup_duplicate_email(client: AsyncClient) -> None:
    await client.post(
        "/api/v1/auth/signup",
        json={"email": "dup@example.com", "password": "password123", "name": "테스트"},
    )
    resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": "dup@example.com", "password": "password456", "name": "테스트2"},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_signup_short_password(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": "short@example.com", "password": "short", "name": "테스트"},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient) -> None:
    # First sign up
    await client.post(
        "/api/v1/auth/signup",
        json={"email": "login@example.com", "password": "password123", "name": "로그인"},
    )

    # Then login
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "login@example.com", "password": "password123"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "login@example.com"
    assert data["role"] == "user"
    assert "csrf_token" in data
    assert "session_id" in resp.cookies


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient) -> None:
    await client.post(
        "/api/v1/auth/signup",
        json={"email": "wrong@example.com", "password": "password123", "name": "테스트"},
    )

    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "wrong@example.com", "password": "wrongpassword"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_email(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "password123"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_unauthenticated(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_forgot_password_always_succeeds(client: AsyncClient) -> None:
    # Should return success even for non-existent email (prevents enumeration)
    resp = await client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "nonexistent@example.com"},
    )
    assert resp.status_code == 200
