"""Agent A: Evidence Normalizer — converts raw evidence to structured NormalizedEvidence."""

import json

from pydantic_ai import Agent

from app.schemas.normalized import NormalizedEvidence

normalizer_agent: Agent[None, NormalizedEvidence] = Agent(
    "anthropic:claude-sonnet-4-6",
    output_type=NormalizedEvidence,
    retries=2,
    system_prompt="""당신은 청년 역량 데이터 정규화 전문가입니다.
주어진 증거 데이터를 분석하여 구조화된 NormalizedEvidence 형식으로 변환하세요.

규칙:
1. GPA는 4.5 스케일로 정규화 (gpa_normalized = gpa / gpa_scale)
2. 전공 관련성은 CS/Engineering, Business, Science, Arts/Humanities, Other 중 하나로 분류
3. 프로젝트 복잡도는 기술 스택 수, 설명 깊이, 성과 유무로 판단
4. 인턴십 관련성은 기술/IT 분야와의 연관성으로 판단
5. 자격증 레벨: national(국가자격), international(국제인증), vendor(기업인증), other
6. 데이터 품질 문제가 있는 경우 data_quality_flags에 기록
7. completeness_score: 8개 카테고리 중 데이터가 있는 비율 (0.0~1.0)

모든 텍스트 필드는 한국어로 작성하세요.
""",
)


def build_normalizer_prompt(raw_evidence: dict) -> str:  # type: ignore[type-arg]
    return f"""다음 역량 증거 데이터를 정규화하세요:

```json
{json.dumps(raw_evidence, ensure_ascii=False, indent=2)}
```

위 데이터를 NormalizedEvidence 형식으로 변환하세요."""
