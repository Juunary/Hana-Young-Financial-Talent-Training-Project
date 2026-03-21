from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.middleware.audit import AuditMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.routers import admin, auth, evaluation, evidence, proof_records, users

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    openapi_url="/api/v1/openapi.json",
)

# Middleware (order matters: outermost first)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(AuditMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "X-CSRF-Token"],
)

# Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(evidence.router)
app.include_router(evidence.upload_router)
app.include_router(evaluation.router)
app.include_router(proof_records.router)
app.include_router(admin.router)


@app.get("/api/v1/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "version": settings.APP_VERSION}
