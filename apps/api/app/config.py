from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Skill Finance Score API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/skillfinance"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Session
    SESSION_TTL_SECONDS: int = 3600
    SESSION_COOKIE_NAME: str = "session_id"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # File Upload
    MAX_FILE_SIZE_MB: int = 10
    MAX_TOTAL_FILE_SIZE_MB: int = 50

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
