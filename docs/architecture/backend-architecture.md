# Backend Architecture

## 기술 스택

| 역할 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | FastAPI | 0.115+ |
| 언어 | Python (uv 관리) | 3.12+ |
| ORM | SQLAlchemy async | 2.0+ |
| DB 드라이버 | asyncpg | 0.30+ |
| 마이그레이션 | Alembic | 1.15+ |
| 캐시/세션/큐 | redis.asyncio | 6.x |
| 태스크 큐 | Celery[redis] | 5.x |
| 검증 | Pydantic v2 | 2.11+ |
| 비밀번호 | argon2-cffi | 25.x |
| 린터 | Ruff | 최신 |
| 타입 체크 | mypy | 최신 |

## 계층 구조

```
app/
├── main.py          FastAPI 앱 진입점, 미들웨어 등록
├── config.py        pydantic-settings 환경 설정
├── dependencies.py  공통 의존성 (get_current_user, get_admin_user)
│
├── middleware/
│   ├── session.py         Redis 세션 관리
│   ├── csrf.py            CSRF 검증 (X-CSRF-Token)
│   ├── rate_limit.py      슬라이딩 윈도우 Rate Limiting
│   ├── security_headers.py HSTS, X-Frame-Options 등
│   └── audit.py           자동 감사 로그 (POST/PUT/PATCH/DELETE)
│
├── routers/         API 엔드포인트 (각 도메인 분리)
├── schemas/         Pydantic 요청/응답 모델
├── services/        비즈니스 로직 계층
├── repositories/    데이터 접근 계층 (SQLAlchemy 쿼리)
├── models/          SQLAlchemy ORM 모델
└── utils/           해싱, canonical JSON, 파일 업로드
```

## 미들웨어 스택 (바깥에서 안쪽 순)

```
SecurityHeadersMiddleware   → HSTS, CSP, X-Frame-Options
RateLimitMiddleware         → Redis 슬라이딩 윈도우
AuditMiddleware             → 자동 감사 로그
CORSMiddleware              → 허용 출처 필터링
```

## 인증 시스템

### Redis 세션 기반 (JWT 미사용)

```
로그인 성공
  → Redis에 세션 저장:
     key: "session:{uuid4}"
     value: {user_id, role, csrf_token, created_at, last_active}
     TTL: 3600초 (활동 시 갱신)
  → Set-Cookie: session_id=...; HttpOnly; Secure; SameSite=Lax; Max-Age=3600
  → Response: {id, role, csrf_token}

요청마다
  → 쿠키에서 session_id 추출
  → Redis 조회 → user_id 확인
  → get_current_user() Depends()
  → 역할 기반 권한 확인 (get_admin_user, get_admin_or_reviewer_user)

세션 로테이션 (로그인 시)
  → 이전 세션 삭제 → 새 세션 생성 (Session Fixation 방어)
```

## Rate Limiting 규칙

| 경로 | 메서드 | 제한 | 윈도우 | 기준 |
|------|--------|------|--------|------|
| `/api/v1/auth/login` | POST | 10 | 60s | IP |
| `/api/v1/auth/signup` | POST | 10 | 60s | IP |
| `/api/v1/evaluations` | POST | 5 | 3600s | 사용자 |
| `/api/v1/uploads` | POST | 20 | 60s | 사용자 |
| `/api/v1/admin` | 전체 | 60 | 60s | 사용자 |
| `/api/v1` (폴백) | 전체 | 120 | 60s | IP |

## 오브젝트 레벨 권한 (IDOR 방지)

```python
# 사용자 네임스페이스: owner만 접근
async def get_owned_evaluation(evaluation_id, user, db):
    ev = await get_by_public_id(db, evaluation_id)
    if ev.user_id != user.id:
        raise HTTPException(403)

# 관리자 네임스페이스: admin 전체, reviewer는 배정 건만
async def _require_admin_evaluation(public_id, user, db):
    req = await admin_repo.get_evaluation_with_details(db, public_id)
    if user.role == "reviewer":
        assignment = await admin_repo.get_active_assignment(db, req.id, user.id)
        if not assignment:
            raise HTTPException(403)
```

## DB 마이그레이션 시퀀스

| 버전 | 내용 |
|------|------|
| 001 | users, user_profiles, consent_records, audit_logs |
| 002 | evidence 8종 (academic, project, internship, certification, education, portfolio, github, uploads) |
| 003 | evaluation_requests, input_snapshots, results, factor_scores, loan_estimates, proof_records |
| 004 | evaluation_assignments, reviewer_notes |

## 감사 로그 자동화

`AuditMiddleware`가 POST/PUT/PATCH/DELETE 성공 응답(2xx)에 대해 자동 기록.
라우터에서 이미 기록하는 인증 이벤트는 중복 방지를 위해 skip.

이벤트 네이밍 예시:
- `evaluation.requested`, `admin.review.created`
- `evidence.modified`, `file.modified`, `profile.modified`
- `auth.login`, `auth.logout`, `auth.login_failed` (라우터 직접 기록)
