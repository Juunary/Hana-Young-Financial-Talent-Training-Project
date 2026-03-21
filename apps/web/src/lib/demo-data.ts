/**
 * Demo mode: 백엔드 없이 프론트엔드 UI를 체험하기 위한 목 데이터.
 */

const DEMO_USER_ID = "demo-usr-00000001";
const DEMO_EVAL_ID = "demo-eval-0001";
const DEMO_PROOF_ID = "demo-proof-0001";

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("demo_mode") === "true";
}

export function enableDemoMode(): void {
  localStorage.setItem("demo_mode", "true");
  document.cookie = "session_id=demo; path=/; max-age=86400; SameSite=Lax";
}

export function disableDemoMode(): void {
  localStorage.removeItem("demo_mode");
  document.cookie = "session_id=; path=/; max-age=0; path=/";
}

// ─── mock data ───

const now = new Date().toISOString();
const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();

const LOGIN_RESPONSE = {
  id: DEMO_USER_ID,
  email: "demo@hanayoung.kr",
  role: "user",
  csrf_token: "demo-csrf-token",
};

const EVIDENCE_SUMMARY = {
  total_categories: 8,
  total_categories_with_data: 5,
  categories: [
    { category: "academic", has_data: true, count: 3 },
    { category: "projects", has_data: true, count: 2 },
    { category: "internships", has_data: true, count: 1 },
    { category: "certifications", has_data: true, count: 2 },
    { category: "education", has_data: true, count: 1 },
    { category: "portfolio", has_data: false, count: 0 },
    { category: "github", has_data: false, count: 0 },
    { category: "uploads", has_data: false, count: 0 },
  ],
};

const EVALUATION_HISTORY = [
  {
    id: DEMO_EVAL_ID,
    status: "completed" as const,
    total_score: 78.5,
    grade: "B+",
    requested_at: oneHourAgo,
    completed_at: now,
  },
];

const FACTOR_SCORES = [
  {
    factor_name: "academic_achievement",
    score_value: 82,
    max_score: 100,
    reason_codes: ["gpa_above_3.5", "finance_major"],
    explanation:
      "금융 관련 전공에서 3.7/4.5 학점을 유지하고 있으며, 재무관리, 투자론 등 핵심 과목에서 우수한 성적을 기록했습니다.",
    confidence: 0.92,
  },
  {
    factor_name: "practical_experience",
    score_value: 71,
    max_score: 100,
    reason_codes: ["internship_completed", "project_participation"],
    explanation:
      "1회의 금융권 인턴십 경험과 2개의 관련 프로젝트 참여 이력이 확인됩니다. 실무 경험의 깊이를 더하면 좋겠습니다.",
    confidence: 0.88,
  },
  {
    factor_name: "certification_credentials",
    score_value: 85,
    max_score: 100,
    reason_codes: ["relevant_cert_held"],
    explanation:
      "금융투자분석사, SQLD 등 금융 및 데이터 관련 자격증 2개를 보유하고 있어 전문성을 입증합니다.",
    confidence: 0.95,
  },
  {
    factor_name: "continuous_learning",
    score_value: 68,
    max_score: 100,
    reason_codes: ["online_course_completed"],
    explanation:
      "온라인 교육 1건이 확인됩니다. 지속적인 학습 이력을 더 쌓으면 점수 향상이 기대됩니다.",
    confidence: 0.82,
  },
  {
    factor_name: "digital_competency",
    score_value: 60,
    max_score: 100,
    reason_codes: ["no_github_profile"],
    explanation:
      "GitHub 프로필 및 포트폴리오가 등록되지 않아 디지털 역량 평가에 제한이 있습니다.",
    confidence: 0.75,
  },
];

const EVALUATION_RESULT = {
  id: DEMO_EVAL_ID,
  status: "completed" as const,
  total_score: 78.5,
  grade: "B+",
  confidence_level: 0.87,
  overall_summary:
    "금융 전공 학업 성취도와 자격증 보유 현황이 우수합니다. 인턴십 경험을 늘리고 디지털 역량(GitHub, 포트폴리오)을 보완하면 A등급 도달이 가능합니다.",
  strengths: [
    "금융 전공 핵심 과목 우수 성적 (3.7/4.5)",
    "금융투자분석사 등 관련 자격증 보유",
    "금융권 인턴십 실무 경험 보유",
  ],
  improvement_areas: [
    "GitHub 프로필 및 오픈소스 기여 활동 필요",
    "포트폴리오 정리 및 공개 필요",
    "추가 인턴십 또는 실무 프로젝트 경험 확대",
  ],
  risk_flags: [],
  needs_human_review: false,
  factor_scores: FACTOR_SCORES,
  loan_estimate: {
    range_min: 5_000_000,
    range_max: 15_000_000,
    rationale:
      "B+ 등급 기준, 학업 성취도와 자격증 보유 현황을 종합적으로 고려한 추정 범위입니다.",
    disclaimer_text:
      "이 금액은 AI 시뮬레이션 결과이며, 실제 대출 심사와는 무관합니다. 참고용으로만 활용하세요.",
  },
  proof_record: {
    id: DEMO_PROOF_ID,
    proof_version: "1.0.0",
    payload_hash_sha256:
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    issuer: "HanaYoung-Prototype-v1",
    verification_status: "issued" as const,
    created_at: now,
  },
  model_version: "gpt-4o-mini-demo",
  scoring_config_version: "1.0.0",
  processing_time_ms: 4230,
  completed_at: now,
};

const EVALUATION_STATUS = {
  id: DEMO_EVAL_ID,
  status: "completed" as const,
  current_stage: null,
  stage_progress: null,
  requested_at: oneHourAgo,
  started_at: oneHourAgo,
  completed_at: now,
  error_message: null,
};

const PROOF_RECORD = {
  id: DEMO_PROOF_ID,
  evaluation_result_id: 1,
  proof_version: "1.0.0",
  payload_hash_sha256:
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  evidence_combined_hash:
    "a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd",
  issuer: "HanaYoung-Prototype-v1",
  verification_status: "issued" as const,
  created_at: now,
};

// ─── route matcher ───

type RouteEntry = [RegExp, string, () => unknown];

const routes: RouteEntry[] = [
  [/\/auth\/login$/, "POST", () => LOGIN_RESPONSE],
  [/\/auth\/signup$/, "POST", () => LOGIN_RESPONSE],
  [/\/auth\/logout$/, "POST", () => undefined],
  [/\/auth\/csrf-token$/, "GET", () => ({ csrf_token: "demo-csrf" })],
  [/\/auth\/refresh$/, "POST", () => LOGIN_RESPONSE],
  [/\/evidence\/summary$/, "GET", () => EVIDENCE_SUMMARY],
  [/\/evidence\/[^/]+$/, "POST", () => ({ id: "demo-ev-001" })],
  [/\/evidence\/[^/]+$/, "GET", () => ({ items: [] })],
  [/\/evaluations\/history$/, "GET", () => EVALUATION_HISTORY],
  [/\/evaluations\/[^/]+\/result$/, "GET", () => EVALUATION_RESULT],
  [/\/evaluations\/[^/]+\/status$/, "GET", () => EVALUATION_STATUS],
  [/\/evaluations\/[^/]+$/, "GET", () => EVALUATION_STATUS],
  [/\/evaluations$/, "POST", () => ({
    id: DEMO_EVAL_ID, status: "completed", requested_at: oneHourAgo,
  })],
  [/\/proof-records\/[^/]+\/verify$/, "POST", () => ({
    valid: true,
    proof_id: DEMO_PROOF_ID,
    computed_hash: PROOF_RECORD.payload_hash_sha256,
    stored_hash: PROOF_RECORD.payload_hash_sha256,
    details: "데모 모드: 해시 검증이 정상적으로 시뮬레이션되었습니다.",
  })],
  [/\/proof-records\/[^/]+$/, "GET", () => PROOF_RECORD],
];

export function matchDemoRoute(path: string, method: string): unknown {
  for (const [pattern, m, handler] of routes) {
    if (pattern.test(path) && m === method) return handler();
  }
  return method === "GET" ? {} : { ok: true };
}
