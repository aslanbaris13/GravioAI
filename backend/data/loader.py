"""Destek programı verilerini diskten yükler ve modele göre doğrular.

`data/programs/` altındaki her `.json` dosyası bir program listesi (JSON array)
içerir. İleride bu katman Supabase/pgvector'a taşınacak; arayüz aynı kalacak.
"""
import json
from functools import lru_cache
from pathlib import Path

from ..models import Category, SupportProgram

_PROGRAMS_DIR = Path(__file__).parent / "programs"


@lru_cache
def load_programs() -> list[SupportProgram]:
    programs: list[SupportProgram] = []
    for path in sorted(_PROGRAMS_DIR.glob("*.json")):
        raw = json.loads(path.read_text(encoding="utf-8"))
        for item in raw:
            programs.append(SupportProgram.model_validate(item))
    return programs


def get_program(program_id: str) -> SupportProgram | None:
    return next((p for p in load_programs() if p.id == program_id), None)


def filter_programs(category: Category | None = None) -> list[SupportProgram]:
    programs = load_programs()
    if category is not None:
        programs = [p for p in programs if p.category == category]
    return programs
