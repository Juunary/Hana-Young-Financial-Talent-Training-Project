import logging

from typing import Any

from app.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=2)  # type: ignore[untyped-decorator]
def run_evaluation(self: Any, evaluation_request_id: int) -> dict[str, str]:
    """Evaluation task placeholder.

    Will be implemented with PydanticAI 3-Agent pipeline in Phase 4.
    Uses sync def + internal asyncio.run() pattern (validated in Celery spike §A.10).
    """
    logger.info(f"Evaluation task received: {evaluation_request_id}")
    return {"status": "not_implemented", "evaluation_request_id": str(evaluation_request_id)}
