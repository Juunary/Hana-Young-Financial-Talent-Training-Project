# 테스트 전략

## 테스트 계층

```
E2E (Playwright)            ← 핵심 사용자 흐름 5개 + 보안 시나리오
    │
통합 테스트 (pytest + httpx) ← API 엔드포인트, DB 연동, 미들웨어
    │
단위 테스트 (pytest / Vitest) ← 서비스 로직, Pydantic 스키마, AI 에이전트 출력 검증
    │
AI Eval Harness              ← 골든 데이터셋 기반 결정론적 검증
```

---

## 백엔드 (pytest)

### 위치

```
apps/api/tests/
├── test_auth.py           ← 인증/세션/CSRF
├── test_evidence.py       ← 증거 CRUD, 소유권 검증
├── test_evaluation.py     ← 평가 요청, 스냅샷 생성, 결과 조회
├── test_admin.py          ← 관리자 API, reviewer 배정, 감사 로그
├── test_authorization.py  ← 권한 매트릭스 자동 검증 (보안 테스트)
└── test_proof_records.py  ← 증명 기록 생성, 무결성 검증

apps/ai-worker/tests/
├── test_normalizer.py     ← Normalizer 에이전트 출력 검증
├── test_scorer.py         ← Scorer 에이전트 + output_validator
├── test_explainer.py      ← Explainer 에이전트 출력 검증
└── test_pipeline.py       ← 3-Agent 파이프라인 통합
```

### 설정

```toml
# apps/api/pyproject.toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

```python
# apps/api/tests/conftest.py
@pytest_asyncio.fixture(scope="session")
async def db():
    """테스트용 PostgreSQL 세션 (실제 DB 연결, mock 금지)."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with async_session_factory() as session:
        yield session
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture
async def client(db):
    """인증 없는 테스트 클라이언트."""
    async with AsyncClient(app=app, base_url="http://test") as c:
        yield c

@pytest_asyncio.fixture
async def auth_client(db):
    """로그인된 일반 사용자 클라이언트."""
    # 테스트 사용자 생성 → 로그인 → 세션 쿠키 + CSRF 토큰 설정
    ...
```

### 권한 매트릭스 테스트 (`test_authorization.py`)

모든 리소스의 IDOR 방어 및 역할 기반 접근 통제를 자동 검증한다.

```python
@pytest.mark.parametrize("path,method,user_fixture,expected_status", [
    # 사용자 네임스페이스 — owner 전용
    ("/api/v1/evaluations/{eval_id}", "GET", "owner_client", 200),
    ("/api/v1/evaluations/{eval_id}", "GET", "other_user_client", 403),
    ("/api/v1/evaluations/{eval_id}", "GET", "reviewer_client", 403),
    ("/api/v1/evaluations/{eval_id}/result", "GET", "owner_client", 200),
    ("/api/v1/evaluations/{eval_id}/result", "GET", "other_user_client", 403),
    # 관리자 네임스페이스 — admin 전체, reviewer 배정 건만
    ("/api/v1/admin/evaluations", "GET", "admin_client", 200),
    ("/api/v1/admin/evaluations", "GET", "reviewer_client", 403),
    ("/api/v1/admin/evaluations/{eval_id}", "GET", "admin_client", 200),
    ("/api/v1/admin/evaluations/{eval_id}", "GET", "reviewer_client_assigned", 200),
    ("/api/v1/admin/evaluations/{eval_id}", "GET", "reviewer_client_unassigned", 403),
    ("/api/v1/admin/audit-logs", "GET", "admin_client", 200),
    ("/api/v1/admin/audit-logs", "GET", "reviewer_client", 403),
])
async def test_access_control(path, method, user_fixture, expected_status, request):
    client = request.getfixturevalue(user_fixture)
    response = await getattr(client, method.lower())(path.format(eval_id=TEST_EVAL_ID))
    assert response.status_code == expected_status
```

### DB 연결 정책

- 테스트는 **실제 PostgreSQL에 연결**한다 (mock 금지).
- 각 테스트 함수는 트랜잭션으로 감싸고 롤백한다.
- 근거: 2026년 1분기 사례 — mock DB에서 통과한 테스트가 실제 마이그레이션에서 실패.

---

## AI Eval Harness

### 골든 데이터셋

```
apps/ai-worker/app/eval/golden_datasets/
├── case_001_strong_student.json       # 높은 점수 기대 (80+)
├── case_002_minimal_data.json         # 낮은 점수 + 보완 필요 (40 미만)
├── case_003_github_heavy.json         # GitHub 중심 프로파일
└── case_004_certification_focus.json  # 자격증 중심 프로파일
```

### 결정론적 검증 (항상 통과해야 함)

```python
def deterministic_checks(result: ScoringResult):
    assert 0 <= result.total_score <= 100
    assert len(result.factor_scores) == 7
    assert abs(sum(fs.score_value for fs in result.factor_scores) - result.total_score) <= 0.01
    for fs in result.factor_scores:
        assert 0 <= fs.score_value <= fs.max_score
    assert result.grade in {"S", "A+", "A", "B+", "B", "C+", "C", "D"}
    assert isinstance(result.needs_human_review, bool)
    for fs in result.factor_scores:
        assert 0.0 <= fs.confidence <= 1.0
```

### LLM Judge (선택적, API 키 보유 시)

```python
def llm_judge(case, explanation: EvaluationExplanation) -> JudgeResult:
    """한국어 품질, 설명 일관성, 근거 적절성 1-5점 평가."""
    # 별도 claude 호출로 설명의 품질 평가
    # CI에는 포함하지 않음 (비용) — 릴리즈 전 수동 실행
```

---

## 프론트엔드 (Vitest)

### 위치

```
apps/web/src/
├── components/**/__tests__/   ← 컴포넌트 단위 테스트
└── hooks/__tests__/           ← 커스텀 훅 테스트
```

### 예시

```typescript
// ScoreGauge.test.tsx
describe('ScoreGauge', () => {
  it('점수 81에서 A 등급을 표시한다', () => {
    render(<ScoreGauge score={81} grade="A" />);
    expect(screen.getByText('81')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('점수 0~100 범위를 벗어나면 에러를 던진다', () => {
    expect(() => render(<ScoreGauge score={150} grade="S" />)).toThrow();
  });
});

// useEvaluationPolling.test.ts
describe('useEvaluationPolling', () => {
  it('status가 completed이면 폴링을 중단한다', async () => {
    // ...
  });
});
```

---

## E2E (Playwright)

### 위치

```
apps/web/e2e/
├── helpers.ts               ← apiSignup, uniqueEmail 유틸리티
├── 01-auth.spec.ts          ← 회원가입, 로그인, 잘못된 자격 증명, 미인증 리다이렉트
├── 02-evidence.spec.ts      ← 증거 허브 8개 카테고리, 학업 저장, 프로젝트 추가
├── 03-evaluation.spec.ts    ← 평가 시작, 제출 리다이렉트, 이력
├── 04-admin.spec.ts         ← 관리자 로그인, 일반 사용자 차단, 평가 목록
├── 05-proof-record.spec.ts  ← 프로토타입 고지 표시, 증명 기록 페이지
└── 06-security-authz.spec.ts ← IDOR, 미인증, CSRF, 관리자 접근 차단
```

### 핵심 보안 시나리오

**IDOR 방어**:
```
사용자 A 회원가입 → 평가 요청 → 로그아웃
사용자 B 로그인 → A의 evaluation/:id에 접근 시도
→ 403 Forbidden 확인
```

**CSRF 방어**:
```
로그인 → CSRF 토큰 없이 POST /api/v1/evidence/projects 요청
→ 403 Forbidden 확인
```

**Rate Limit**:
```
동일 IP에서 로그인 10회 초과 요청
→ 429 Too Many Requests + Retry-After 헤더 확인
```

### 설정

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  workers: 1,           // 순차 실행 (DB 경합 방지)
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  // CI에서는 webServer 없음 (이미 실행 중인 서버 재사용)
});
```

---

## 커버리지 목표

| 레이어 | 도구 | 목표 |
|--------|------|------|
| 백엔드 API | pytest-cov | 80% 라인 커버리지 |
| AI 파이프라인 | pytest-cov | 70% 라인 커버리지 (mock 기반) |
| 프론트엔드 컴포넌트 | Vitest + c8 | 70% 라인 커버리지 |
| E2E | Playwright | 핵심 흐름 6개 시나리오 모두 통과 |

---

## CI 실행 순서

```
1. lint (ruff / ESLint)
2. type-check (mypy / tsc --noEmit)
3. unit + integration (pytest / Vitest)
4. E2E (Playwright) — staging 환경에서만
5. AI eval harness (개발 환경, API 키 있는 경우)
```

---

## 테스트 데이터 전략

| 환경 | 전략 |
|------|------|
| CI (단위/통합) | `conftest.py` fixture로 생성 + 트랜잭션 롤백 |
| CI (E2E) | `apiSignup` 헬퍼로 테스트마다 고유 사용자 생성 (`Date.now()` suffix) |
| 스테이징 | `scripts/seed-db.py`로 시드 데이터 적용 |
| 프로덕션 | 시드 스크립트 미실행. 관리자 계정만 수동 생성 |

---

## 금지 사항

- 테스트에서 DB를 mock하지 않는다 (실제 PostgreSQL 연결 필수).
- 테스트 간 전역 상태를 공유하지 않는다.
- `--no-verify`로 커밋 훅을 우회하지 않는다.
- 프로덕션 DB에 테스트를 실행하지 않는다.
