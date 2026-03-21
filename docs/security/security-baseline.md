# Security Baseline

## 인증 / 세션

| 항목 | 구현 |
|------|------|
| 세션 저장소 | Redis 단일 source of truth (TTL 1시간, 활동 시 갱신) |
| 쿠키 설정 | `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600` |
| 세션 로테이션 | 로그인 성공 시 이전 세션 삭제 + 새 세션 발급 |
| CSRF | 상태 변경 요청 시 `X-CSRF-Token` 헤더 검증 |
| 브루트포스 방어 | 이메일별 5회 실패 시 15분 잠금 (Redis 카운터) |
| JWT 미사용 | 즉각 무효화 불가 문제로 서버사이드 세션 채택 |

## 비밀번호

| 항목 | 구현 |
|------|------|
| 알고리즘 | argon2id (argon2-cffi) |
| 비용 파라미터 | time_cost=3, memory_cost=65536, parallelism=4 |
| Salt | 자동 생성 (argon2 내장) |
| 평문 저장 | 절대 금지 |

## Rate Limiting

Redis 슬라이딩 윈도우. 엔드포인트별 차등:
- 인증 API: 10회/60초 (IP 기준)
- 평가 요청: 5회/시간 (사용자 기준)
- 일반 API: 120회/60초 (IP 기준)

초과 시: `429 Too Many Requests` + `Retry-After` 헤더

## 보안 헤더 (FastAPI 미들웨어)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## IDOR 방지

- 외부 노출 ID: UUID v7 (`public_id` 컬럼)
- 내부 PK: auto-increment int (응답에 절대 미포함)
- 모든 리소스 접근 시 오브젝트 레벨 인가 강제
- 권한 매트릭스 자동 검증 (`tests/test_admin.py`)

## 파일 업로드 보안

| 항목 | 구현 |
|------|------|
| Public-read | 절대 금지 (S3 객체는 private) |
| 업로드 | presigned PUT URL (15분 만료) |
| 열람 | 권한 확인 후 signed GET URL (5분 만료) |
| 파일명 | S3 키 = `{uuid}/{random_hex}.{ext}` |
| MIME 검증 | Content-Type + magic bytes 이중 확인 |
| 용량 제한 | 파일당 10MB, 사용자당 총 50MB |

## 감사 로그 PII 처리

```python
def redact_pii(payload):
    # email → j***@example.com
    # name  → 첫글자***
    # ip_address → 원문 보존 (감사 목적 필요)
```

## 데이터 보호

- 민감 데이터 최소 수집 (주민번호, 계좌번호 미수집)
- S3 서버 사이드 암호화 (SSE-S3)
- 환경 변수 → AWS Secrets Manager (로컬 .env)
- `raw_ai_response` 90일 후 NULL 처리 (Celery Beat 스케줄)
- 로그 파일: 세션 ID 원문 금지 (salted hash로 상관관계만 기록)

## 의존성 보안

- Dependabot: weekly (npm, pip, GitHub Actions)
- pip-audit: CI 매 PR
- npm audit: CI 매 PR
- CodeQL: PR + main push (Python + JS/TS)
- TruffleHog: secret scanning (커밋 이력 포함)

## CI 보안 원칙

- 모든 third-party action: 커밋 SHA 핀닝
- AWS 자격 증명: OIDC (정적 키 없음)
- production 배포: GitHub Environments 수동 승인 필수
- `--no-verify` 훅 우회 금지
