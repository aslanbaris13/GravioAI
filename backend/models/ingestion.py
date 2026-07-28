"""Veri senkronizasyonu (scrape + ingest) çalıştırma kayıtları."""
from datetime import datetime

from pydantic import BaseModel


class IngestionRun(BaseModel):
    """`ingestion_runs` tablosundaki bir satır — bkz. `data.repo.log_ingestion_run`."""

    id: str
    source: str
    status: str
    docs_found: int = 0
    chunks_upserted: int = 0
    error_msg: str | None = None
    started_at: datetime
    finished_at: datetime
