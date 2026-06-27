"""Destek programı JSON dosyalarını diskten okur ve modele göre doğrular.

Veri ekibinin sağladığı `data/programs/*.json` dosyaları ingestion'ın kaynağıdır
(`scripts/ingest.py` bunları okuyup embed'leyerek Supabase'e yükler). Çalışma
zamanı okumaları artık Supabase üzerinden yapılır (`data/repo.py`).
"""
import json
from functools import lru_cache
from pathlib import Path

from ..models import SupportProgram

_PROGRAMS_DIR = Path(__file__).parent / "programs"


@lru_cache
def load_programs() -> list[SupportProgram]:
    programs: list[SupportProgram] = []
    for path in sorted(_PROGRAMS_DIR.glob("*.json")):
        raw = json.loads(path.read_text(encoding="utf-8"))
        for item in raw:
            programs.append(SupportProgram.model_validate(item))
    return programs
