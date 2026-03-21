import os
from collections.abc import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

os.environ.setdefault("DEBUG", "true")  # Disable Secure flag on cookies for http://test

from app.db.session import get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models.base import Base  # noqa: E402

# In-memory SQLite for tests (async)
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"


@pytest.fixture(autouse=True)
def mock_redis():
    """Mock Redis for all tests."""
    store: dict[str, str] = {}

    async def mock_get(key: str) -> str | None:
        return store.get(key)

    async def mock_setex(key: str, ttl: int, value: str) -> None:
        store[key] = value

    async def mock_delete(key: str) -> None:
        store.pop(key, None)

    async def mock_expire(key: str, ttl: int) -> bool:
        return key in store

    async def mock_incr(key: str) -> int:
        val = int(store.get(key, "0")) + 1
        store[key] = str(val)
        return val

    mock = AsyncMock()
    mock.get = AsyncMock(side_effect=mock_get)
    mock.setex = AsyncMock(side_effect=mock_setex)
    mock.delete = AsyncMock(side_effect=mock_delete)
    mock.expire = AsyncMock(side_effect=mock_expire)

    pipe_mock = MagicMock()
    pipe_mock.incr = MagicMock()
    pipe_mock.expire = MagicMock()
    pipe_mock.execute = AsyncMock(return_value=[1, True])
    mock.pipeline = lambda: pipe_mock

    with (
        patch("app.middleware.session.get_redis", return_value=mock),
        patch("app.routers.auth.get_redis", return_value=mock),
    ):
        yield mock


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient]:
    async def override_get_db() -> AsyncGenerator[AsyncSession]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
