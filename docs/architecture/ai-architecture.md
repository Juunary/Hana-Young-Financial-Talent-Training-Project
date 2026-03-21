# AI Architecture

## 핵심 철학

> AI는 "자유 생성 LLM"이 아닌, **구조화된 평가 엔진**이다.
> 자유 서술 환각을 금지하고, Pydantic 스키마 강제 + 규칙 기반 검증을 병행한다.

## 3-Agent 파이프라인

```
입력 데이터 (EvaluationInputSnapshot)
        │
        ▼
  Rule-Based 전처리 (GPA 정규화, 필수 필드 검증)
        │
        ▼
  Agent A: Normalizer
  Output: NormalizedEvidence (Pydantic)
        │
        ▼
  Agent B: Scorer
  Output: ScoringResult (Pydantic)
        │
        ▼
  Output Validator (팩터합 == 총점, 최대값 초과 차단)
        │
        ▼
  Agent C: Explainer
  Output: EvaluationExplanation (Pydantic)
        │
        ▼
  DB 저장 + ProofRecord 생성
```

## 에이전트 역할

| 에이전트 | 입력 | 출력 | 역할 |
|---------|------|------|------|
| Normalizer | raw evidence dict | NormalizedEvidence | 비정형 데이터 정규화, 누락 감지 |
| Scorer | NormalizedEvidence + ScoringConfig | ScoringResult | 7개 팩터 점수 산출, needs_human_review 판단 |
| Explainer | ScoringResult + NormalizedEvidence | EvaluationExplanation | 한국어 설명, 강점/개선영역, 대출 범위 |

## 채점 요소 (scoring_config.yaml)

| 팩터 | 최대 점수 |
|------|---------|
| 학업 역량 (academic) | 15점 |
| 프로젝트 깊이 (project) | 25점 |
| 실무 경험 (internship) | 20점 |
| 자격/인증 (certification) | 10점 |
| 포트폴리오 (portfolio) | 15점 |
| GitHub 활동 (github) | 10점 |
| 일관성/완성도 (consistency) | 5점 |
| **합계** | **100점** |

## Output Validator

```python
@scorer_agent.output_validator
async def validate_scores(ctx, output: ScoringResult) -> ScoringResult:
    # 팩터 합계 == 총점 검증
    computed_total = sum(fs.score_value for fs in output.factor_scores)
    if abs(computed_total - output.total_score) > 0.01:
        raise ModelRetry("팩터 점수 합계가 총점과 불일치")

    # 팩터별 최대값 초과 방지
    for fs in output.factor_scores:
        max_val = config.get_max_score(fs.factor_name)
        if fs.score_value > max_val:
            raise ModelRetry(f"{fs.factor_name} 점수 최대값 초과")

    return output
```

## Celery 태스크 멱등성

```python
# 멱등성 가드 순서:
1. status == "completed" → 즉시 return
2. status == "processing" + started_at 10분 이내 → retry(countdown=30)
3. status == "processing" + stale → 재진입 허용
4. status == "failed" / "pending" → 정상 실행

# 설정
task_acks_late = True           # 완료 후 ack
task_reject_on_worker_lost = True  # worker 사망 시 requeue
max_retries = 2
```

## 입력 스냅샷 고정 (재현성)

평가 요청 시점에 `EvaluationInputSnapshot`을 생성하여 고정:
- `snapshot_payload`: canonical JSON (sort_keys, ensure_ascii=False, UTC 날짜)
- `payload_hash_sha256`: SHA-256(canonical JSON)
- `scoring_config_snapshot`: 요청 시점의 채점 설정 전체
- `model_version`: 요청 시점의 LLM 모델명
- `prompt_version`: 프롬프트 파일 버전

**워커는 원본 evidence 테이블을 읽지 않는다.** 스냅샷만 사용.

## AI 안전장치 요약

| 위협 | 대응 |
|------|------|
| 환각 | Pydantic strict schema 강제, reason_codes enum 제한 |
| 점수 조작 | output_validator (합계 검증, 최대값 차단) |
| 프롬프트 인젝션 | 사용자 입력 → JSON 직렬화 후 전달 (직접 삽입 금지) |
| PII 노출 | agent context에 user_id만 전달, 이메일/이름 미포함 |
| 비용 폭주 | 사용자당 평가 5회/시간 Rate Limit |
| 재현 불가 | model_version + scoring_config_version + prompt_version + raw_ai_response 저장 |

## Eval Harness

```
apps/ai-worker/app/eval/golden_datasets/
  case_001_strong_student.json    # 높은 점수 기대
  case_002_minimal_data.json      # 낮은 점수 + 보완 필요
  case_003_github_heavy.json      # GitHub 중심 프로필
  case_004_certification_focus.json # 자격증 중심

결정론적 검증:
  - 0 <= total_score <= 100
  - factor_scores 개수 == 7
  - sum(factor_scores) ≈ total_score
  - 모든 factor_score <= max_score
  - grade in VALID_GRADES
```
