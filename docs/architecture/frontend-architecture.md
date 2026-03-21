# Frontend Architecture

## 기술 스택

| 역할 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js App Router | 15.x |
| 언어 | TypeScript strict | 5.x |
| 스타일 | Tailwind CSS | 4.x |
| UI 컴포넌트 | shadcn/ui + Radix UI | 최신 |
| 차트 | Recharts | 3.x |
| 폼 관리 | React Hook Form + Zod | 7.x / 4.x |
| HTTP 클라이언트 | 커스텀 ApiClient (fetch 기반) | - |
| 아이콘 | Lucide React | 0.577+ |

## 라우트 그룹 구조

```
app/
├── (public)/    랜딩, About, 약관, 면책 — SSG/ISR, 정적 CSP
├── (auth)/      로그인, 회원가입, 비밀번호 찾기 — SSR, nonce CSP
├── (app)/       인증 사용자 영역 — SSR, nonce CSP
└── (admin)/     관리자/심사자 영역 — SSR, nonce CSP
```

## 컴포넌트 계층

### `apps/web/src/components/`

```
ui/                 shadcn/ui 기반 원자 컴포넌트
  button, card, input, label, dialog, tabs, badge ...

layout/             앱 셸
  AppShell          전체 레이아웃 래퍼
  Header            상단 네비게이션
  SideNavigation    좌측 메뉴
  PageTitle         페이지 제목 + 설명

common/             범용 상태 컴포넌트
  AlertNotice       경고/안내 배너 (프로토타입 고지 포함)
  EmptyState        데이터 없음 상태
  ErrorState        오류 상태
  LoadingSkeleton   로딩 스켈레톤

evaluation/         평가 전용 컴포넌트
  ScoreGauge        전체 점수 SVG 반원형 게이지
  FactorChart       팩터별 수평 바 차트 (Recharts)
  LoanRangeEstimateCard  대출 범위 시뮬레이션 카드
  ProofRecordCard   증명 기록 요약 카드
```

## 인증 및 세션 전략

```typescript
// apps/web/src/middleware.ts
// 쿠키 기반 라우팅 보호 (Next.js Edge Middleware)

const PUBLIC_PATHS = ['/', '/about', '/privacy', '/terms', '/disclaimer'];
const AUTH_PATHS = ['/auth/login', '/auth/signup', '/auth/forgot-password'];

// session_id 쿠키 없으면 → /auth/login?redirect={path}
// session_id 있는데 AUTH_PATHS 접근 → /dashboard 리다이렉트
```

## API 클라이언트

```typescript
// apps/web/src/lib/api-client.ts
class ApiClient {
  csrfToken: string | null = null;

  // 자동 CSRF 헤더 주입 (POST/PUT/PATCH/DELETE)
  // credentials: "include" (세션 쿠키 자동 포함)
  // 오류 시 ApiClientError (status, code, message)
}
```

## CSP 전략

| 라우트 그룹 | 렌더링 방식 | CSP 방식 |
|------------|-----------|---------|
| `(public)` | SSG | 정적 CSP (next.config.ts headers) |
| `(auth)` | SSR | nonce 기반 동적 CSP |
| `(app)` | SSR | nonce 기반 동적 CSP |
| `(admin)` | SSR | nonce 기반 동적 CSP |

## 데이터 흐름

### 평가 상태 폴링

```
evaluation/[id]/page.tsx
  useEffect → setInterval(5000)
  → GET /api/v1/evaluations/{id}/status
  → status === "completed" → router.push("/evaluation/{id}/result")
  → status === "failed" → 오류 표시, polling 중단
  → cleanup: clearInterval on unmount
```

### 인증 상태

```
로그인 성공 → api.setCsrfToken(res.csrf_token)
  → 메모리에 보관 (localStorage/sessionStorage 미사용)
  → 모든 POST/PUT/PATCH/DELETE에 X-CSRF-Token 헤더 자동 삽입
  → 페이지 새로고침 시 GET /auth/csrf-token 재요청
```

## 디자인 토큰

```typescript
// packages/config/tailwind/preset.ts
colors: {
  brand: {
    primary: '#00857A',        // 하나은행 그린
    'primary-strong': '#006C63',
    secondary: '#4CB7A5',
    'soft-bg': '#EAF7F4',
    'mint-border': '#B9DFD8',
  },
  semantic: {
    success: '#1F9D6A',
    warning: '#C98A00',
    danger: '#D9534F',
    info: '#2F6FED',
  },
}
borderRadius: { financial: '8px' }
```

## 프로토타입 고지 전략

모든 평가 결과 화면에 `AlertNotice` 컴포넌트로 고지:
- "본 서비스는 프로토타입 시뮬레이션입니다."
- 대출 범위 카드에 별도 danger 박스
- 관리자 상세 화면에 "PROTOTYPE" 배지
- Footer 고정 문구
