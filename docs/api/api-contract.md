# API Contract

## 공통 규칙

- **Base URL**: `/api/v1/`
- **응답 형식**: JSON (`Content-Type: application/json`)
- **인증**: HTTP-Only Session Cookie (`session_id`)
- **CSRF**: `X-CSRF-Token` 헤더 (POST / PUT / PATCH / DELETE)
- **외부 노출 ID**: UUID v7 (`public_id`). 내부 int PK는 응답에 절대 미포함.

### 에러 응답 표준

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "학점은 0.0~4.5 범위여야 합니다.",
    "details": [
      { "field": "gpa", "message": "범위 초과" }
    ]
  }
}
```

| HTTP 코드 | code 예시 | 의미 |
|-----------|-----------|------|
| 400 | `VALIDATION_ERROR` | 요청 파라미터 검증 실패 |
| 401 | `UNAUTHORIZED` | 세션 없음 또는 만료 |
| 403 | `FORBIDDEN` | 권한 부족 (역할 또는 소유권) |
| 404 | `NOT_FOUND` | 리소스 없음 |
| 409 | `CONFLICT` | 중복 리소스 |
| 422 | `UNPROCESSABLE_ENTITY` | 비즈니스 로직 위반 |
| 429 | `RATE_LIMIT_EXCEEDED` | Rate limit 초과 |
| 500 | `INTERNAL_SERVER_ERROR` | 서버 내부 오류 |

### 페이지네이션

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 156,
    "total_pages": 8
  }
}
```

---

## 인증 (`/auth`)

### POST /auth/signup

회원가입.

**Request**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "홍길동"
}
```

**Response 201**
```json
{
  "id": "01920000-0000-7000-0000-000000000001",
  "email": "user@example.com"
}
```
Set-Cookie: `session_id=...; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`

---

### POST /auth/login

로그인. 이전 세션 삭제 + 새 세션 발급 (Session Fixation 방어).

**Request**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response 200**
```json
{
  "id": "01920000-0000-7000-0000-000000000001",
  "role": "user",
  "csrf_token": "abc123def456..."
}
```

---

### POST /auth/logout

세션 삭제.

**Response 204** No Content

---

### POST /auth/refresh

세션 갱신 + 새 CSRF 토큰.

**Response 200**
```json
{ "csrf_token": "new_token_here" }
```

---

### POST /auth/forgot-password

비밀번호 재설정 이메일 발송.

**Request**
```json
{ "email": "user@example.com" }
```

**Response 200**
```json
{ "message": "비밀번호 재설정 링크가 이메일로 발송되었습니다." }
```

---

### POST /auth/reset-password

**Request**
```json
{
  "token": "reset_token_from_email",
  "new_password": "NewSecurePass123!"
}
```

**Response 200**
```json
{ "message": "비밀번호가 변경되었습니다." }
```

---

### GET /auth/csrf-token

SPA 새로고침 시 CSRF 토큰 재발급.

**Response 200**
```json
{ "csrf_token": "abc123def456..." }
```

---

## 사용자 (`/me`, `/consents`)

### GET /me

현재 사용자 정보.

**Response 200**
```json
{
  "id": "01920000-0000-7000-0000-000000000001",
  "email": "user@example.com",
  "role": "user",
  "profile": {
    "name": "홍길동",
    "birth_year": 2000,
    "university": "서울대학교",
    "major": "컴퓨터공학",
    "graduation_status": "enrolled",
    "employment_status": "student"
  },
  "consent_status": {
    "privacy": true,
    "evaluation": true,
    "data_usage": false
  }
}
```

---

### PATCH /me

프로필 업데이트.

**Request** (부분 업데이트 가능)
```json
{
  "name": "홍길동",
  "university": "서울대학교",
  "major": "컴퓨터공학",
  "graduation_status": "enrolled",
  "employment_status": "student"
}
```

**Response 200** — 업데이트된 프로필

---

### POST /consents

동의 기록 생성.

**Request**
```json
{
  "consents": [
    { "consent_type": "privacy", "consent_version": "1.0", "accepted": true },
    { "consent_type": "evaluation", "consent_version": "1.0", "accepted": true },
    { "consent_type": "data_usage", "consent_version": "1.0", "accepted": true }
  ]
}
```

**Response 201**
```json
{ "message": "동의가 기록되었습니다." }
```

---

### GET /consents/latest

**Response 200**
```json
{
  "privacy": { "accepted": true, "accepted_at": "2026-03-20T09:00:00Z", "version": "1.0" },
  "evaluation": { "accepted": true, "accepted_at": "2026-03-20T09:00:00Z", "version": "1.0" },
  "data_usage": { "accepted": false, "accepted_at": null, "version": null }
}
```

---

## 역량 데이터 (`/evidence`)

### GET /evidence/summary

입력 현황 요약.

**Response 200**
```json
{
  "categories": {
    "academic": { "status": "completed", "count": 1 },
    "projects": { "status": "partial", "count": 2 },
    "internships": { "status": "empty", "count": 0 },
    "certifications": { "status": "completed", "count": 3 },
    "education": { "status": "empty", "count": 0 },
    "portfolio": { "status": "completed", "count": 1 },
    "github": { "status": "completed", "count": 1 },
    "uploads": { "status": "partial", "count": 1 }
  },
  "overall_completeness": 0.62
}
```

---

### GET /evidence/academic

**Response 200**
```json
{
  "id": 1,
  "university": "서울대학교",
  "major": "컴퓨터공학",
  "degree_type": "bachelor",
  "gpa": 4.0,
  "gpa_scale": 4.5,
  "gpa_normalized": 0.889,
  "admission_year": 2020,
  "graduation_year": null,
  "is_draft": false
}
```

---

### PUT /evidence/academic

**Request**
```json
{
  "university": "서울대학교",
  "major": "컴퓨터공학",
  "degree_type": "bachelor",
  "gpa": 4.0,
  "gpa_scale": 4.5,
  "admission_year": 2020,
  "graduation_year": null
}
```

**Response 200** — 저장된 학업 기록

---

### GET /evidence/projects

**Response 200**
```json
{
  "data": [
    {
      "id": 3,
      "title": "실시간 주가 분석 대시보드",
      "role": "풀스택 개발",
      "duration_months": 4,
      "start_date": "2025-09-01",
      "end_date": "2025-12-31",
      "description": "Python FastAPI + Next.js로 구축한 실시간 주가 분석 시스템",
      "tech_stack": ["Python", "FastAPI", "Next.js", "PostgreSQL", "Redis"],
      "outcome_summary": "DAU 200명, 응답 시간 200ms 이하",
      "project_url": "https://github.com/user/stock-dashboard",
      "is_draft": false
    }
  ]
}
```

---

### POST /evidence/projects

**Request**
```json
{
  "title": "실시간 주가 분석 대시보드",
  "role": "풀스택 개발",
  "duration_months": 4,
  "start_date": "2025-09-01",
  "end_date": "2025-12-31",
  "description": "...",
  "tech_stack": ["Python", "FastAPI"],
  "outcome_summary": "...",
  "project_url": "https://github.com/user/project"
}
```

**Response 201** — 생성된 프로젝트 레코드

---

### PUT /evidence/projects/:id · DELETE /evidence/projects/:id

표준 수정/삭제. 204 No Content (삭제).

동일 패턴이 `/internships`, `/certifications`, `/education`에도 적용.

---

### GET /evidence/portfolio

**Response 200**
```json
{
  "links": [
    { "id": 1, "url": "https://portfolio.example.com", "label": "개인 포트폴리오", "type": "website" },
    { "id": 2, "url": "https://notion.so/my-work", "label": "노션 포트폴리오", "type": "notion" }
  ]
}
```

---

### GET /evidence/github

**Response 200**
```json
{
  "username": "octocat",
  "profile_url": "https://github.com/octocat",
  "public_repos": 42,
  "followers": 150,
  "total_contributions_last_year": 1200,
  "repos": [
    {
      "name": "awesome-project",
      "url": "https://github.com/octocat/awesome-project",
      "stars": 87,
      "forks": 12,
      "primary_language": "Python",
      "commit_count_snapshot": 245,
      "last_activity_at": "2026-02-15T10:30:00Z"
    }
  ],
  "snapshot_at": "2026-03-20T09:00:00Z"
}
```

---

### POST /uploads/presign

Presigned PUT URL 요청.

**Request**
```json
{
  "filename": "transcript.pdf",
  "content_type": "application/pdf"
}
```

**Response 200**
```json
{
  "upload_url": "https://s3.amazonaws.com/bucket/...",
  "file_id": "01920000-0000-7000-0000-000000000099",
  "expires_at": "2026-03-20T09:15:00Z"
}
```

---

### POST /uploads/complete

업로드 완료 알림 (클라이언트가 S3 PUT 완료 후 호출).

**Request**
```json
{ "file_id": "01920000-0000-7000-0000-000000000099" }
```

**Response 200**
```json
{
  "file_id": "01920000-0000-7000-0000-000000000099",
  "original_name": "transcript.pdf",
  "size_bytes": 204800,
  "mime_type": "application/pdf"
}
```

---

## 평가 (`/evaluations`)

### POST /evaluations

평가 요청 생성. 요청 시점의 전체 evidence를 스냅샷으로 고정하고 Celery 큐에 투입.

**Request** (Body 없음 — 세션의 현재 사용자 기준)

**Response 202**
```json
{
  "id": "01920000-0000-7000-0000-000000000010",
  "status": "pending",
  "requested_at": "2026-03-20T09:30:00Z"
}
```

---

### GET /evaluations/:id

평가 상세 (상태 + 완료 시 결과 포함).

**Response 200 (processing)**
```json
{
  "id": "01920000-0000-7000-0000-000000000010",
  "status": "processing",
  "current_stage": "scoring",
  "requested_at": "2026-03-20T09:30:00Z",
  "started_at": "2026-03-20T09:30:05Z",
  "result": null
}
```

**Response 200 (completed)**
```json
{
  "id": "01920000-0000-7000-0000-000000000010",
  "status": "completed",
  "requested_at": "2026-03-20T09:30:00Z",
  "completed_at": "2026-03-20T09:30:45Z",
  "result": {
    "total_score": 81.0,
    "grade": "A",
    "factor_scores": [
      {
        "factor_name": "academic",
        "score_value": 12.5,
        "max_score": 15.0,
        "reason_codes": ["GPA_HIGH", "MAJOR_RELEVANCE_STRONG"],
        "explanation": "4.0/4.5 학점으로 상위 수준이며, 컴퓨터공학 전공은 IT 금융 분야와 높은 관련성을 보입니다.",
        "confidence": 0.92
      }
    ],
    "overall_summary": "전반적으로 우수한 역량 프로파일을 보유하고 있습니다...",
    "strengths": ["프로젝트 경험의 기술적 깊이", "GitHub 활동의 지속성"],
    "improvement_areas": ["자격증 취득을 통한 전문성 공식화", "인턴십 경험 추가"],
    "risk_flags": [],
    "needs_human_review": false,
    "loan_estimate": {
      "min_amount": 30000000,
      "max_amount": 50000000,
      "rationale": "80점 이상 구간으로 최상위 시뮬레이션 범위에 해당합니다.",
      "disclaimer": "본 결과는 프로토타입 시뮬레이션이며, 실제 금융기관의 대출 심사와 무관합니다."
    },
    "proof_record_id": "01920000-0000-7000-0000-000000000020"
  }
}
```

---

### GET /evaluations/:id/status

상태만 조회 (폴링용, 5초 간격).

**Response 200**
```json
{
  "status": "processing",
  "current_stage": "scoring",
  "stage_progress": {
    "stages": ["normalizing", "scoring", "explaining", "saving"],
    "current_index": 1,
    "total": 4
  }
}
```

---

### GET /evaluations/:id/result

결과 상세.

**Response 200** — `GET /evaluations/:id`의 `result` 필드와 동일 구조

---

### GET /evaluations/:id/compare

이전 평가 대비 변화.

**Query**: `?previous_id={previous_public_id}`

**Response 200**
```json
{
  "current": {
    "id": "01920000-0000-7000-0000-000000000010",
    "total_score": 81.0,
    "grade": "A",
    "factors": [{ "factor_name": "academic", "score_value": 12.5 }],
    "scoring_config_version": "1.0.0",
    "model_version": "anthropic:claude-sonnet-4-6"
  },
  "previous": {
    "id": "01920000-0000-7000-0000-000000000008",
    "total_score": 72.5,
    "grade": "B+",
    "factors": [{ "factor_name": "academic", "score_value": 12.5 }],
    "scoring_config_version": "1.0.0",
    "model_version": "anthropic:claude-sonnet-4-6"
  },
  "delta": {
    "total": 8.5,
    "factors": [
      { "factor_name": "academic", "prev": 12.5, "curr": 12.5, "diff": 0.0 },
      { "factor_name": "project", "prev": 15.0, "curr": 20.5, "diff": 5.5 }
    ]
  },
  "methodology_changed": false,
  "methodology_diff": null
}
```

`methodology_changed: true` 시 `methodology_diff` 포함:
```json
{
  "model_changed": false,
  "scoring_config_changed": true,
  "previous_config_version": "1.0.0",
  "current_config_version": "1.1.0"
}
```

---

### GET /evaluations/history

내 평가 이력.

**Response 200**
```json
{
  "data": [
    {
      "id": "01920000-0000-7000-0000-000000000010",
      "status": "completed",
      "total_score": 81.0,
      "grade": "A",
      "requested_at": "2026-03-20T09:30:00Z",
      "completed_at": "2026-03-20T09:30:45Z"
    }
  ],
  "pagination": { "page": 1, "per_page": 10, "total": 3, "total_pages": 1 }
}
```

---

## 증명 기록 (`/proof-records`)

### GET /proof-records/:id

**Response 200**
```json
{
  "id": "01920000-0000-7000-0000-000000000020",
  "proof_version": "1.0.0",
  "issuer": "skill-finance-score-prototype-v1",
  "payload_hash_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "evidence_combined_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "verification_status": "issued",
  "created_at": "2026-03-20T09:30:45Z",
  "blockchain_anchor": null
}
```

---

### POST /proof-records/:id/verify

무결성 검증.

**Response 200**
```json
{
  "valid": true,
  "details": {
    "hash_match": true,
    "computed_hash": "e3b0c44298fc...",
    "stored_hash": "e3b0c44298fc...",
    "verification_status": "issued",
    "issued_at": "2026-03-20T09:30:45Z"
  }
}
```

**Response 200 (무결성 실패)**
```json
{
  "valid": false,
  "details": {
    "hash_match": false,
    "reason": "해시가 일치하지 않습니다. 데이터가 변조되었을 수 있습니다."
  }
}
```

---

## 관리자 (`/admin`)

> 모든 `:id`는 `public_id` (UUID v7).

### POST /admin/login

관리자/심사자 전용 로그인 (역할 검증 포함).

**Request**
```json
{ "email": "admin@example.com", "password": "AdminPass123!" }
```

**Response 200**
```json
{
  "id": "01920000-0000-7000-0000-000000000002",
  "role": "admin",
  "csrf_token": "admin_csrf_token_here"
}
```

---

### GET /admin/evaluations

전체 평가 목록 (admin only).

**Query**: `?page=1&per_page=20&status=completed&needs_human_review=true&search=홍길동`

**Response 200**
```json
{
  "data": [
    {
      "id": "01920000-0000-7000-0000-000000000010",
      "user": { "id": "...", "email": "user@example.com", "name": "홍길동" },
      "status": "completed",
      "total_score": 81.0,
      "grade": "A",
      "needs_human_review": false,
      "requested_at": "2026-03-20T09:30:00Z",
      "completed_at": "2026-03-20T09:30:45Z",
      "assigned_reviewer": null
    }
  ],
  "pagination": { "page": 1, "per_page": 20, "total": 47, "total_pages": 3 }
}
```

---

### GET /admin/evaluations/:id

평가 상세 (스냅샷 증거 + AI 결과 + raw 응답).

**Response 200**
```json
{
  "id": "01920000-0000-7000-0000-000000000010",
  "user": { "id": "...", "email": "user@example.com", "name": "홍길동" },
  "status": "completed",
  "result": { "...": "GET /evaluations/:id result와 동일" },
  "snapshot": {
    "scoring_config_version": "1.0.0",
    "model_version": "anthropic:claude-sonnet-4-6",
    "prompt_version": "1.0.0",
    "payload_hash_sha256": "e3b0c44298fc...",
    "created_at": "2026-03-20T09:30:00Z"
  },
  "raw_ai_response": { "...": "AI 원본 응답 (admin only)" },
  "reviewer_notes": [
    {
      "id": 1,
      "reviewer": { "id": "...", "name": "심사자1" },
      "comment": "프로젝트 경험이 인상적입니다.",
      "status_change": "reviewed",
      "created_at": "2026-03-20T10:00:00Z"
    }
  ],
  "assignment": {
    "reviewer": { "id": "...", "name": "심사자1" },
    "review_status": "reviewed",
    "assigned_at": "2026-03-20T09:45:00Z"
  }
}
```

---

### POST /admin/evaluations/:id/review

리뷰 코멘트 + 상태 변경 (admin 전체, reviewer 배정 건만).

**Request**
```json
{
  "comment": "전반적으로 우수한 프로파일입니다. 인턴십 경험 추가를 권고합니다.",
  "status_change": "reviewed"
}
```

**status_change 허용값**: `reviewed` | `needs_more_info` | `approved_for_demo`

**Response 201**
```json
{
  "id": 5,
  "comment": "전반적으로 우수한 프로파일입니다...",
  "status_change": "reviewed",
  "created_at": "2026-03-20T10:00:00Z"
}
```

---

### POST /admin/evaluations/:id/assign

Reviewer 배정 (admin only).

**Request**
```json
{ "reviewer_id": "01920000-0000-7000-0000-000000000003" }
```

**Response 201**
```json
{
  "assignment_id": 12,
  "reviewer": { "id": "...", "name": "심사자1" },
  "review_status": "assigned",
  "assigned_at": "2026-03-20T09:45:00Z"
}
```

---

### PATCH /admin/evaluations/:id/reassign

Reviewer 재배정 (admin only).

**Request**
```json
{ "new_reviewer_id": "01920000-0000-7000-0000-000000000004" }
```

**Response 200** — 새 assignment 정보

---

### GET /admin/review-queue

리뷰 대기 목록.

- admin: `needs_human_review=true`인 전체 목록
- reviewer: 자신에게 배정되고 `review_status`가 `assigned` 또는 `in_review`인 목록

**Response 200** — `/admin/evaluations` 응답과 동일 구조

---

### GET /admin/audit-logs

감사 로그 (admin only).

**Query**: `?page=1&per_page=50&event_name=evaluation.requested&from=2026-03-01T00:00:00Z&to=2026-03-31T23:59:59Z`

**Response 200**
```json
{
  "data": [
    {
      "id": 1001,
      "actor_type": "user",
      "actor": { "id": "...", "email": "u***@example.com" },
      "event_name": "evaluation.requested",
      "resource_type": "evaluation_request",
      "resource_id": "01920000-0000-7000-0000-000000000010",
      "ip_address": "192.168.1.100",
      "created_at": "2026-03-20T09:30:00Z",
      "event_payload": { "evaluation_id": "01920000-..." }
    }
  ],
  "pagination": { "page": 1, "per_page": 50, "total": 1250, "total_pages": 25 }
}
```

---

## Rate Limit 정책

| 엔드포인트 | 메서드 | 제한 | 윈도우 | 기준 |
|-----------|--------|------|--------|------|
| `/api/v1/auth/login` | POST | 10 | 60초 | IP |
| `/api/v1/auth/signup` | POST | 10 | 60초 | IP |
| `/api/v1/evaluations` | POST | 5 | 3600초 | 사용자 |
| `/api/v1/uploads` | POST | 20 | 60초 | 사용자 |
| `/api/v1/admin` | 전체 | 60 | 60초 | 사용자 |
| `/api/v1` (폴백) | 전체 | 120 | 60초 | IP |

초과 시: `429 Too Many Requests` + `Retry-After: {seconds}` 헤더

---

## TypeScript 타입 자동 생성

```bash
# FastAPI /openapi.json → TypeScript 타입 생성
npx openapi-typescript http://localhost:8000/openapi.json \
  --output packages/types/src/api-generated.ts
```
