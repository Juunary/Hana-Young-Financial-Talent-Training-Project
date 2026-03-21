"""3-Agent evaluation pipeline: Normalizer → Scorer → Explainer."""

import logging
import time
from collections.abc import Callable

from app.agents.explainer import build_explainer_prompt, explainer_agent
from app.agents.normalizer import build_normalizer_prompt, normalizer_agent
from app.agents.scorer import ScorerDeps, build_scorer_prompt, scorer_agent
from app.schemas.explanation import EvaluationExplanation
from app.schemas.normalized import NormalizedEvidence
from app.schemas.scoring import ScoringResult

logger = logging.getLogger(__name__)


async def run_pipeline(
    raw_evidence: dict,  # type: ignore[type-arg]
    stage_callback: Callable[[str], None] | None = None,
) -> tuple[NormalizedEvidence, ScoringResult, EvaluationExplanation, int]:
    """Execute the 3-agent pipeline.

    Returns:
        (normalized, scoring, explanation, processing_time_ms)
    """
    start = time.monotonic()

    def _stage(name: str) -> None:
        logger.info(f"Pipeline stage: {name}")
        if stage_callback:
            stage_callback(name)

    # Agent A: Normalize
    _stage("normalizing")
    norm_result = await normalizer_agent.run(build_normalizer_prompt(raw_evidence))
    normalized: NormalizedEvidence = norm_result.output

    # Agent B: Score
    _stage("scoring")
    from app.agents.scorer import FACTOR_MAX_SCORES

    score_result = await scorer_agent.run(
        build_scorer_prompt(normalized),
        deps=ScorerDeps(factor_max_scores=FACTOR_MAX_SCORES),
    )
    scoring: ScoringResult = score_result.output

    # Agent C: Explain
    _stage("explaining")
    explain_result = await explainer_agent.run(
        build_explainer_prompt(scoring, normalized)
    )
    explanation: EvaluationExplanation = explain_result.output

    elapsed_ms = int((time.monotonic() - start) * 1000)
    return normalized, scoring, explanation, elapsed_ms
