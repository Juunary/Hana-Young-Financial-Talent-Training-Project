"""Agent C: Explanation Generator — produces Korean explanations + loan simulation."""

from pydantic_ai import Agent

from app.schemas.explanation import EvaluationExplanation
from app.schemas.normalized import NormalizedEvidence
from app.schemas.scoring import ScoringResult

LOAN_RANGES = [
    (80, 30_000_000, 50_000_000),
    (60, 15_000_000, 30_000_000),
    (40, 5_000_000, 15_000_000),
    (0, 1_000_000, 5_000_000),
]
LOAN_DISCLAIMER = (
    "본 결과는 프로토타입 시뮬레이션이며, "
    "실제 금융기관의 대출 심사와 무관합니다."
)

explainer_agent: Agent[None, EvaluationExplanation] = Agent(
    "anthropic:claude-sonnet-4-6",
    output_type=EvaluationExplanation,
    retries=2,
    system_prompt="""당신은 청년 금융 역량 평가 결과를 설명하는 전문가입니다.
평가 점수와 정규화된 역량 데이터를 바탕으로 명확하고 이해하기 쉬운 한국어 설명을 작성하세요.

규칙:
1. overall_summary: 3~5문장으로 전체 평가 요약
2. strengths: 3~5개의 구체적인 강점 (근거 있는 내용만)
3. improvement_areas: 3~5개의 개선 가능 영역
4. loan_estimate: 점수 기반 대출 범위 시뮬레이션 (반드시 면책 조항 포함)
5. follow_up_recommendations: 2~3개 후속 추천 행동
6. 환각 금지: 입력 데이터에 없는 내용은 생성하지 마세요
7. 모든 내용은 한국어로 작성하세요
""",
)


def build_explainer_prompt(
    scoring: ScoringResult, normalized: NormalizedEvidence
) -> str:
    # Compute loan range deterministically (rule-based, not LLM)
    loan_min, loan_max = 1_000_000, 5_000_000
    for threshold, lo, hi in LOAN_RANGES:
        if scoring.total_score >= threshold:
            loan_min, loan_max = lo, hi
            break

    return f"""다음 평가 결과와 역량 데이터를 바탕으로 설명을 생성하세요:

## 점수 결과
- 총점: {scoring.total_score:.1f}/100 ({scoring.grade}등급)
- 팩터별 점수: {[f"{fs.factor_name}:{fs.score_value:.1f}" for fs in scoring.factor_scores]}
- 위험 신호: {scoring.risk_flags}

## 정규화된 역량 데이터
{normalized.model_dump_json(indent=2, exclude_none=True)}

## 대출 범위 (규칙 기반 산출)
- 최소: {loan_min:,}원, 최대: {loan_max:,}원

위 정보를 바탕으로 EvaluationExplanation을 생성하세요.
loan_estimate의 min_amount={loan_min}, max_amount={loan_max}을 그대로 사용하세요."""
