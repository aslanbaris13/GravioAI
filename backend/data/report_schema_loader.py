"""Rapor gereksinim şemalarını (backend/data/report_schemas/*.json) diskten
okur ve modele göre doğrular. Yeni bir program eklemek kod değişikliği değil,
buraya yeni bir JSON dosyası eklemek demektir.
"""
import json
from functools import lru_cache
from pathlib import Path

from ..models import ReportSchema

_SCHEMAS_DIR = Path(__file__).parent / "report_schemas"


@lru_cache
def load_report_schemas() -> list[ReportSchema]:
    schemas: list[ReportSchema] = []
    for path in sorted(_SCHEMAS_DIR.glob("*.json")):
        raw = json.loads(path.read_text(encoding="utf-8"))
        schemas.append(ReportSchema.model_validate(raw))
    return schemas


def get_report_schema(key: str) -> ReportSchema | None:
    for schema in load_report_schemas():
        if schema.key == key:
            return schema
    return None


def resolve_report_schema_for_program(program_title: str) -> ReportSchema | None:
    """Eşleşen bir programın başlığında şema anahtar kelimelerinden biri
    geçiyorsa o şemayı döner — henüz her program için gerçek bir şema yok,
    bulunamazsa None döner (arayüz bunu "henüz hazır değil" olarak gösterir)."""
    title_lower = program_title.lower()
    for schema in load_report_schemas():
        if any(kw in title_lower for kw in schema.match_keywords):
            return schema
    return None
