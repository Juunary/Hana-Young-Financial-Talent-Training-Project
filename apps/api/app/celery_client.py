"""Minimal Celery client for dispatching tasks from the API to the AI Worker."""

import os

from celery import Celery  # type: ignore[import-untyped]

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Thin Celery app — only used for send_task(); tasks are registered in ai-worker
celery_client = Celery(broker=REDIS_URL, backend=REDIS_URL)
celery_client.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
)
