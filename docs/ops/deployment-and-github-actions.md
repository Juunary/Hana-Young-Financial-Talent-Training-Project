# 배포 및 GitHub Actions

## 브랜치 전략

```
main (보호)          ← 프로덕션 기준, PR 필수, 리뷰 1명 이상
  ↑
develop (통합)       ← feature 브랜치 머지 대상
  ↑
feature/SKF-*        ← 기능 개발
hotfix/SKF-*         ← 긴급 수정 (main에서 직접 분기)
```

- `main` / `develop` 브랜치: 직접 push 금지, PR + 상태 체크 통과 필수
- 모든 PR: 최소 1인 리뷰 승인 + CI 통과 후 머지

---

## GitHub Actions 워크플로우

### 워크플로우 목록

| 파일 | 트리거 | 역할 |
|------|--------|------|
| `ci.yml` | PR, develop/main push | lint + test + build |
| `ci-security.yml` | PR, main push | CodeQL + 의존성 감사 + 시크릿 스캔 |
| `build-images.yml` | develop/main push | Docker 이미지 빌드 → ECR |
| `deploy-staging.yml` | develop push (CI 성공 후) | 스테이징 DB 마이그레이션 + ECS 배포 |
| `deploy-production.yml` | main push (수동 승인) | 프로덕션 DB 마이그레이션 + ECS 배포 |

---

### ci.yml — 통합 CI

**트리거**: PR 열기/업데이트, `develop`·`main` push

**Jobs**:

```
detect-changes (dorny/paths-filter)
      │
      ├── ci-web (apps/web 변경 시)
      │    lint → type-check → vitest (coverage) → next build
      │
      ├── ci-api (apps/api 변경 시)
      │    ruff check → mypy → pytest (PostgreSQL + Redis 서비스 컨테이너)
      │
      └── ci-ai (apps/ai-worker 변경 시)
           ruff check → mypy → pytest (mock 기반)
```

**서비스 컨테이너 (ci-api)**:
```yaml
services:
  postgres:
    image: postgres:17-alpine
    env: { POSTGRES_DB: test_db, POSTGRES_PASSWORD: test_pass }
    options: --health-cmd pg_isready
  redis:
    image: redis:7-alpine
    options: --health-cmd "redis-cli ping"
```

---

### ci-security.yml — 보안 CI

**트리거**: PR, `main` push

| Job | 도구 | 역할 |
|-----|------|------|
| `codeql` | `github/codeql-action` | Python + JavaScript 정적 분석 |
| `dependency-audit-python` | `pip-audit` | apps/api + apps/ai-worker 의존성 취약점 |
| `dependency-audit-node` | `pnpm audit` | 프론트엔드 의존성 취약점 |
| `secret-scan` | TruffleHog | 커밋 이력 포함 시크릿 스캔 |

---

### build-images.yml — Docker 이미지 빌드

**트리거**: `develop`, `main` push

**태그 전략**:
- `develop` push: `{commit-sha}`, `develop`
- `main` push: `{commit-sha}`, `latest`

**ECR 저장소**:
- `skill-finance/api`
- `skill-finance/web`
- `skill-finance/ai-worker`

---

### deploy-staging.yml — 스테이징 배포

**트리거**: `develop` push + `ci.yml` 성공

**Job 순서**:

```
db-migration
    ↓ (성공 시)
deploy (api → web → ai-worker)
    ↓ (성공 시)
smoke-test
```

**환경**: `staging` (GitHub Environment)

**스모크 테스트**:
```bash
# 핵심 엔드포인트 헬스체크
curl -f https://staging.skill-finance.example.com/api/v1/health
curl -f https://staging.skill-finance.example.com/api/v1/auth/csrf-token
```

---

### deploy-production.yml — 프로덕션 배포

**트리거**: `main` push

**차이점 (staging 대비)**:
- `environment: production` → 수동 승인 필요 (required reviewer 1명 이상)
- 별도 AWS 역할 ARN 사용 (`AWS_DEPLOY_ROLE_ARN_PROD`)
- 롤백 단계 포함 (배포 실패 시 이전 태스크 정의로 복원)

---

## GitHub Actions 보안 원칙

### SHA 핀닝

모든 third-party action은 커밋 SHA로 고정한다.

```yaml
# 올바른 예
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2
- uses: aws-actions/configure-aws-credentials@e3dd6a429d7300a6a4c196c26e071d42e0343502  # v4.0.2

# 잘못된 예 (버전 태그 핀닝 - 변경 가능)
- uses: actions/checkout@v4
```

### OIDC 인증

정적 AWS 키 없이 OIDC로 임시 자격 증명 발급.

```yaml
permissions:
  id-token: write
  contents: read

steps:
  - uses: aws-actions/configure-aws-credentials@<SHA>
    with:
      role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
      aws-region: ap-northeast-2
```

### 필요한 GitHub Secrets

| Secret | 용도 |
|--------|------|
| `AWS_DEPLOY_ROLE_ARN` | 스테이징 배포용 OIDC IAM 역할 |
| `AWS_DEPLOY_ROLE_ARN_PROD` | 프로덕션 배포용 OIDC IAM 역할 |
| `ECR_REGISTRY` | ECR 레지스트리 URI |
| `STAGING_DB_URL` | 스테이징 DB 연결 문자열 (Alembic용) |

### Dependabot

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule: { interval: "weekly" }
  - package-ecosystem: "npm"
    directory: "/"
    schedule: { interval: "weekly" }
  - package-ecosystem: "pip"
    directory: "/apps/api"
    schedule: { interval: "weekly" }
  - package-ecosystem: "pip"
    directory: "/apps/ai-worker"
    schedule: { interval: "weekly" }
```

---

## AWS 인프라 구성

```
                    CloudFront + WAF
                          │
              ┌───────────┴───────────┐
              │                       │
         Next.js (ECS)          FastAPI (ECS)
              │                       │
              │                AI Worker (ECS Celery)
              │                       │
              └───────────┬───────────┘
                     Private Subnet
                  ┌────────┐ ┌───────────┐
                  │PostgreSQL│ │   Redis   │
                  │  (RDS)   │ │(ElastiCache│
                  └────────┘ └───────────┘
                          │
                         S3 (파일)
```

### ECS 태스크 정의 (요약)

| 서비스 | CPU | Memory | 최소 태스크 수 |
|--------|-----|--------|--------------|
| api | 512 | 1024 MB | 1 |
| web | 512 | 1024 MB | 1 |
| ai-worker | 1024 | 2048 MB | 1 |

### Alembic 마이그레이션 실행

배포 전 DB 마이그레이션을 별도 ECS Task로 실행한다.

```bash
# ECS Run Task (마이그레이션 전용 컨테이너)
aws ecs run-task \
  --cluster skill-finance-staging \
  --task-definition skill-finance-migration \
  --overrides '{"containerOverrides":[{"name":"api","command":["alembic","upgrade","head"]}]}'
```

롤백 시:
```bash
aws ecs run-task \
  ... --overrides '{"containerOverrides":[{"name":"api","command":["alembic","downgrade","-1"]}]}'
```

---

## 로컬 개발 환경

```bash
# 1. 인프라 서비스 시작 (PostgreSQL + Redis + Mailhog)
docker compose -f infra/docker/docker-compose.yml up -d

# 2. DB 마이그레이션
cd apps/api && uv run alembic upgrade head

# 3. Seed 데이터 (관리자 계정 + 샘플 평가)
cd apps/api && uv run python ../../scripts/seed-db.py

# 4. API 서버
cd apps/api && uv run uvicorn app.main:app --reload --port 8000

# 5. AI Worker
cd apps/ai-worker && uv run celery -A app.celery_app worker -l info

# 6. Web 앱
pnpm --filter web dev

# 7. 전체 lint + test
pnpm turbo lint test
```

---

## 배포 체크리스트

### 스테이징 배포 전

- [ ] `develop` 브랜치 CI 전체 통과
- [ ] 새 Alembic 마이그레이션이 있다면 `down_revision` 체인 확인
- [ ] 환경 변수/시크릿 최신 상태 확인

### 프로덕션 배포 전

- [ ] 스테이징에서 핵심 흐름 수동 검증
- [ ] 감사 로그 이상 없음 확인
- [ ] DB 백업 최신 상태 확인
- [ ] 담당자 슬랙 알림 발송
- [ ] GitHub Environment 수동 승인

### 배포 후

- [ ] 스모크 테스트 통과
- [ ] CloudWatch 오류율 정상
- [ ] 평가 End-to-End 시나리오 수동 확인
