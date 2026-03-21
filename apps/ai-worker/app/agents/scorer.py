"""Agent B: Scoring Assistant — produces 7-factor scores with validation."""

import json
from dataclasses import dataclass

from pydantic_ai import Agent
from pydantic_ai.exceptions import ModelRetry

from app.schemas.normalized import NormalizedEvidence
from app.schemas.scoring import ScoringResult

FACTOR_MAX_SCORES: dict[str, float] = {
    "academic": 15.0,
    "project": 25.0,
    "internship": 20.0,
    "certification": 10.0,
    "portfolio": 15.0,
    "github": 10.0,
    "consistency": 5.0,
}

GRADE_THRESHOLDS = [
    (90, "S"),
    (85, "A+"),
    (80, "A"),
    (70, "B+"),
    (60, "B"),
    (50, "C+"),
    (40, "C"),
    (0, "D"),
]


@dataclass
class ScorerDeps:
    factor_max_scores: dict[str, float]


scorer_agent: Agent[ScorerDeps, ScoringResult] = Agent(
    "anthropic:claude-sonnet-4-6",
    deps_type=ScorerDeps,
    output_type=ScoringResult,
    retries=2,
    system_prompt="""당신은 청년 역량 기반 금융 평가 전문가입니다.
정규화된 역량 데이터를 바탕으로 7개 팩터별 점수를 산출하세요.

팩터별 최대 점수:
- academic(학업 역량): 15점
- project(프로젝트 깊이): 25점
- internship(실무 경험): 20점
- certification(자격/인증): 10점
- portfolio(포트폴리오): 15점
- github(GitHub 활동): 10점
- consistency(일관성/완성도): 5점
총합: 100점

규칙:
1. 각 팩터 점수는 0 이상 최대점수 이하
2. total_score = 7개 팩터 score_value의 합계 (반드시 일치)
3. grade: S(90+), A+(85+), A(80+), B+(70+), B(60+), C+(50+), C(40+), D(0+)
4. reason_codes: 점수 근거 코드 (e.g., "GPA_HIGH", "PROJECT_DEPTH_MEDIUM")
5. 불일치나 위험 신호는 risk_flags에 기록

모든 explanation 필드는 한국어로 작성하세요.
""",
)


@scorer_agent.output_validator
async def validate_scores(
    ctx: object, output: ScoringResult  # noqa: ARG001 — ctx required by PydanticAI
) -> ScoringResult:
    """Verify that factor scores sum to total_score and don't exceed max values."""
    computed = sum(fs.score_value for fs in output.factor_scores)
    if abs(computed - output.total_score) > 0.5:
        raise ModelRetry(
            f"팩터 점수 합계({computed:.2f})가 총점({output.total_score:.2f})과 불일치합니다. "
            "다시 계산하세요."
        )
    for fs in output.factor_scores:
        max_val = FACTOR_MAX_SCORES.get(fs.factor_name, 100.0)
        if fs.score_value > max_val + 0.01:
            raise ModelRetry(
                f"{fs.factor_name} 점수({fs.score_value:.2f})가 최대값({max_val})을 초과합니다."
            )
    return output


def build_scorer_prompt(normalized: NormalizedEvidence) -> str:
    return f"""다음 정규화된 역량 데이터를 바탕으로 7개 팩터별 점수를 산출하세요:

```json
{normalized.model_dump_json(indent=2)}
```

7개 팩터(academic, project, internship, certification, portfolio, github, consistency) 모두에 대해
점수를 매기세요. total_score는 7개 팩터 합계와 정확히 일치해야 합니다."""


def compute_grade(total_score: float) -> str:
    """Deterministic grade from score (used as fallback/override)."""
    for threshold, grade in GRADE_THRESHOLDS:
        if total_score >= threshold:
            return grade
    return "D"
