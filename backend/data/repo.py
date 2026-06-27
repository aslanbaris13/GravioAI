"""Supabase (REST) tabanlı veri erişim katmanı.

Backend, Postgres'e doğrudan bağlanmak yerine Supabase REST API üzerinden
çalışır (service_role anahtarı ile). Vektör benzerlik araması `match_programs`
RPC fonksiyonu üzerinden yapılır.

Fonksiyonlar senkron; async route'lar bunları `run_in_threadpool` ile çağırır.
"""
from functools import lru_cache

from supabase import Client, create_client

from ..core.config import get_settings
from ..models import Category, SupportProgram

_TABLE = "programs"


@lru_cache
def _client() -> Client:
    s = get_settings()
    return create_client(s.supabase_url, s.supabase_key)


def program_embedding_text(p: SupportProgram) -> str:
    """Bir programın vektörlenecek metni — eşleştirme kalitesini belirleyen alanlar.

    (Veri ekibiyle netleşince güncellenecek; şimdilik makul varsayılan.)
    """
    parts = [
        p.program_name,
        p.institution,
        p.description,
        p.target_audience,
        p.sector,
        p.category,
    ]
    return " — ".join(part for part in parts if part)


def _to_row(p: SupportProgram, embedding: list[float] | None = None) -> dict:
    """SupportProgram'ı DB satırına (İngilizce kolon adları) çevirir."""
    row = p.model_dump(mode="json")  # alan adları (alias değil), tarihler ISO string
    if embedding is not None:
        row["embedding"] = embedding
    return row


def _from_row(row: dict) -> SupportProgram:
    """DB satırını modele çevirir (fazladan kolonlar — embedding vb. — yok sayılır)."""
    return SupportProgram.model_validate(row)


def upsert_programs(rows: list[dict]) -> int:
    """Hazır satırları (embedding dahil) toplu upsert eder, yazılan kayıt sayısını döner."""
    if not rows:
        return 0
    resp = _client().table(_TABLE).upsert(rows).execute()
    return len(resp.data or [])


def get_programs(category: Category | None = None) -> list[SupportProgram]:
    query = _client().table(_TABLE).select("*").order("id")
    if category is not None:
        query = query.eq("category", category.value)
    resp = query.execute()
    return [_from_row(r) for r in (resp.data or [])]


def get_program(program_id: str) -> SupportProgram | None:
    resp = _client().table(_TABLE).select("*").eq("id", program_id).limit(1).execute()
    data = resp.data or []
    return _from_row(data[0]) if data else None


def match_programs(
    query_embedding: list[float],
    *,
    match_count: int = 5,
    category: Category | None = None,
) -> list[SupportProgram]:
    """Verilen embedding'e en yakın programları (kosinüs) döner — RAG eşleştirmesi."""
    resp = _client().rpc(
        "match_programs",
        {
            "query_embedding": query_embedding,
            "match_count": match_count,
            "filter_category": category.value if category else None,
        },
    ).execute()
    return [_from_row(r) for r in (resp.data or [])]
