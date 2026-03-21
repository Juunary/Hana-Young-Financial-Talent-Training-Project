# Overall System Architecture

## Overview

Skill Finance Score는 대학생·취업준비생의 역량 데이터를 AI로 분석하여 보완적 신용평가 점수를 산출하는 프로토타입 웹 서비스이다.

## 시스템 구성도

```
┌──────────────────────────────────────────────────────────────────┐
│                        CloudFront + WAF                          │
└──────────┬────────────────────────────────────────┬─────────────┘
           │                                        │
      ┌────▼─────┐                           ┌─────▼──────┐
      │  Web App  │                           │   API App  │
      │ (Next.js) │                           │ (FastAPI)  │
      │  ECS/EC2  │                           │  ECS/EC2   │
      └────┬──────┘                           └─────┬──────┘
           │                                        │
           │              ┌─────────────────────────┤
           │              │                         │
           │         ┌────▼──────┐         ┌────────▼───────┐
           │         │ AI Worker  │         │   PostgreSQL   │
           │         │ (Celery)   │         │    (RDS 17)    │
           │         │  ECS/EC2   │         └────────────────┘
           │         └────┬───────┘
           │              │         ┌───────────────────┐
           └──────────────┴─────────►    Redis 7         │
                                    │  (ElastiCache)     │
                                    │ Session / Queue /  │
                                    │ Rate Limit Cache   │
                                    └───────────────────┘
                                            │
                                    ┌───────▼───────────┐
                                    │        S3          │
                                    │  (파일 업로드)     │
                                    └───────────────────┘
```

## 컴포넌트 역할

| 컴포넌트 | 기술 | 역할 |
|---------|------|------|
| Web App | Next.js 15 (App Router) | 사용자/관리자 프론트엔드, SSR/SSG |
| API App | FastAPI 0.115+ | REST API, 인증, 비즈니스 로직 |
| AI Worker | Celery + PydanticAI | 비동기 AI 평가 파이프라인 |
| PostgreSQL | RDS 17 | 영구 데이터 저장 (사용자, 증거, 평가 결과) |
| Redis | ElastiCache 7 | 세션, Celery 브로커/백엔드, Rate Limit |
| S3 | AWS S3 | 파일 업로드 (presigned URL) |
| CloudFront | CDN | 정적 자산 캐싱, WAF 통합 |

## 요청 흐름

### 사용자 평가 요청

```
사용자 브라우저
  → POST /api/v1/evaluations (Next.js → FastAPI)
  → API: 증거 스냅샷 생성 + SHA-256 해시 저장
  → API: Celery 태스크 투입 (Redis Queue)
  → API: 202 응답 (public_id 반환)
  → 브라우저: 5초 polling (GET /evaluations/{id}/status)
  → AI Worker: 스냅샷에서 데이터 로드
  → AI Worker: Normalizer → Scorer → Explainer 파이프라인 실행
  → AI Worker: 결과 저장 + 증명 기록 생성
  → 브라우저: 완료 감지 → 결과 페이지 이동
```

### 인증 흐름

```
POST /auth/login
  → 자격 증명 검증 (Argon2 해시 비교)
  → Redis에 세션 저장 (TTL 1시간)
  → Set-Cookie: session_id (HttpOnly, Secure, SameSite=Lax)
  → 응답: csrf_token (메모리 보관, X-CSRF-Token 헤더로 전송)
```

## 보안 레이어

1. **네트워크**: CloudFront WAF (IP 차단, 봇 방어)
2. **전송**: HTTPS only, HSTS
3. **인증**: HTTP-Only 쿠키 세션 (JWT 미사용)
4. **CSRF**: X-CSRF-Token 헤더 검증
5. **Rate Limiting**: Redis 슬라이딩 윈도우 (엔드포인트별 차등)
6. **입력 검증**: Pydantic v2 (서버) + Zod (클라이언트)
7. **감사**: 모든 상태 변경 자동 기록
8. **ID 보안**: 외부 노출 ID = UUID v7 (내부 PK 노출 없음)

## 모노레포 구조

```
apps/web/          Next.js 15 프론트엔드
apps/api/          FastAPI 백엔드
apps/ai-worker/    PydanticAI + Celery 워커
packages/ui/       공유 UI 컴포넌트
packages/config/   공유 설정 (ESLint, Tailwind, TypeScript)
packages/types/    공유 TypeScript 타입
infra/docker/      로컬 개발 환경 (docker-compose)
.github/workflows/ CI/CD 파이프라인
docs/              설계 문서
```

## 주요 설계 결정

| 결정 | 선택 | 이유 |
|------|------|------|
| 세션 방식 | Server-side Redis 세션 | 즉각 무효화, 금융 등급 보안 |
| AI 출력 | 구조화된 Pydantic 스키마 강제 | 환각 방지, 검증 가능한 결과 |
| ID 전략 | 외부 UUID v7 + 내부 int PK | IDOR 방지 + 조인 성능 |
| 입력 고정 | 요청 시점 스냅샷 | 재현성, 증명 기록 무결성 |
| 평가 큐 | Celery + Redis | LLM 처리 시간 분리, 폴링 UX |
