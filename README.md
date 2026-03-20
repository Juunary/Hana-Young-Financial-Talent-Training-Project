# Skill Finance Score

AI 기반 역량보완 신용평가 프로토타입 — 청년 역량 데이터를 활용한 보완적 신용평가 서비스

> **프로토타입 고지**: 본 서비스는 프로토타입 시뮬레이션이며, 실제 금융기관의 신용평가와 무관합니다.

## 아키텍처 개요

| 앱 | 기술 | 설명 |
| --- | --- | --- |
| `apps/web` | Next.js 15 (App Router) + Tailwind CSS 4 | 프론트엔드 (한국어 UI) |
| `apps/api` | FastAPI + SQLAlchemy 2 (async) | REST API 서버 |
| `apps/ai-worker` | Celery + PydanticAI | AI 평가 파이프라인 워커 |
| `packages/ui` | shadcn/ui + Radix UI | 공유 UI 컴포넌트 |
| `packages/config` | Tailwind preset | 공유 설정 (디자인 토큰) |
| `packages/types` | TypeScript | 공유 타입 정의 |

**인프라**: PostgreSQL 17 + Redis 7 + Mailhog (개발용)

## 사전 요구사항

- **Node.js** 22+
- **pnpm** 10+
- **Python** 3.12+
- **uv** (Python 패키지 관리)
- **Docker** & **Docker Compose**

## 시작하기

### 1. 인프라 서비스 실행

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

PostgreSQL (`localhost:5432`), Redis (`localhost:6379`), Mailhog (`localhost:8025`) 이 실행됩니다.

### 2. 환경 변수 설정

```bash
cp .env.example .env
# .env 파일을 열어 필요한 값을 수정하세요
```

### 3. Node.js 의존성 설치

```bash
pnpm install
```

### 4. Python 의존성 설치

```bash
# API 서버
cd apps/api && uv sync --dev && cd ../..

# AI Worker
cd apps/ai-worker && uv sync --dev && cd ../..
```

### 5. DB 마이그레이션

```bash
cd apps/api && uv run alembic upgrade head && cd ../..
```

### 6. 개발 서버 실행

```bash
# 터미널 1: Next.js 프론트엔드
pnpm --filter web dev

# 터미널 2: FastAPI 백엔드
cd apps/api && uv run uvicorn app.main:app --reload --port 8000

# 터미널 3: AI Worker
cd apps/ai-worker && uv run celery -A app.celery_app worker -l info
```

- 프론트엔드: http://localhost:3000
- API 문서: http://localhost:8000/api/docs
- Mailhog: http://localhost:8025

## 스크립트

```bash
pnpm dev          # 전체 dev 서버 (turbo)
pnpm build        # 전체 빌드
pnpm lint         # 전체 린트
pnpm type-check   # 전체 타입 체크
pnpm test         # 전체 테스트
pnpm format       # Prettier 포맷
```

### Python (apps/api, apps/ai-worker)

```bash
uv run ruff check .     # 린트
uv run mypy app/        # 타입 체크
uv run pytest           # 테스트
```

## 프로젝트 구조

```
├── apps/
│   ├── web/            # Next.js 15 프론트엔드
│   ├── api/            # FastAPI 백엔드
│   └── ai-worker/      # PydanticAI + Celery 워커
├── packages/
│   ├── ui/             # 공유 UI 컴포넌트
│   ├── config/         # 공유 설정 (디자인 토큰)
│   └── types/          # 공유 TypeScript 타입
├── infra/
│   └── docker/         # Docker Compose + init.sql
├── docs/               # 아키텍처/설계 문서
└── scripts/            # 유틸리티 스크립트
```

## 기술 스택

**프론트엔드**: Next.js 15, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, TanStack Query, Zustand, React Hook Form + Zod, Recharts

**백엔드**: FastAPI, SQLAlchemy 2 (async), Alembic, PostgreSQL 17, Redis 7, Celery

**AI**: PydanticAI (3-Agent 파이프라인: Normalizer → Scorer → Explainer)

**인프라**: Docker, GitHub Actions, AWS (ECS, RDS, ElastiCache, S3, CloudFront)
