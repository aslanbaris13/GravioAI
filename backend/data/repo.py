"""Supabase (REST) tabanlı veri erişim katmanı.

Backend, Postgres'e doğrudan bağlanmak yerine Supabase REST API üzerinden
çalışır (service_role anahtarı ile). Vektör benzerlik araması `match_programs`
RPC fonksiyonu üzerinden yapılır.

Fonksiyonlar senkron; async route'lar bunları `run_in_threadpool` ile çağırır.
"""
from functools import lru_cache

from supabase import Client, create_client

from core.config import get_settings
from models import Category, SupportProgramDB

_TABLE = "programs_v2"  # yeni, nihai şemaya sahip tablo


@lru_cache
def _client() -> Client:
    s = get_settings()
    return create_client(s.supabase_url, s.supabase_key)


def program_embedding_text(p: SupportProgramDB) -> str:
    """Bir programın vektörlenecek metni — eşleştirme kalitesini belirleyen alanlar.

    Not: Burada sadece 'anlamsal' alanları kullanıyoruz (isim, kurum, kategori,
    kadın girişimci/teknopark/öğrenci şartları). Sayısal/tarihsel alanlar
    (deadline, amount_max, region vb.) embedding'e girmiyor; onlar için
    arama sırasında SQL WHERE filtresi kullanılacak.
    """
    parts = [
        p.title,
        p.source,
        p.category if p.category else None,
    ]

    # Evet/hayır şartlarını, embedding'in anlayabileceği cümlelere çeviriyoruz
    if p.women_entrepreneur:
        parts.append("Kadın girişimcilere özel avantaj sağlar")
    if p.technopark:
        parts.append("Teknopark'ta olma şartı vardır")
    if p.student:
        parts.append("Öğrenciler başvurabilir")

    return " — ".join(part for part in parts if part)


def _to_row(p: SupportProgramDB, embedding: list[float] | None = None) -> dict:
    """SupportProgramDB'yi DB satırına (İngilizce kolon adları) çevirir."""
    row = p.model_dump(mode="json")  # alan adları (alias değil), enum'lar string'e döner
    if embedding is not None:
        row["embedding"] = embedding
    return row


def _from_row(row: dict) -> SupportProgramDB:
    """DB satırını modele çevirir (fazladan kolonlar varsa yok sayılır)."""
    return SupportProgramDB.model_validate(row)


def upsert_programs(rows: list[dict]) -> int:
    """Hazır satırları (embedding dahil) toplu upsert eder, yazılan kayıt sayısını döner."""
    if not rows:
        return 0
    resp = _client().table(_TABLE).upsert(rows, on_conflict="program_id").execute()
    return len(resp.data or [])

def get_programs(category: Category | None = None) -> list[SupportProgramDB]:
    """Kategoriye göre (isteğe bağlı) tüm programları getirir."""
    query = _client().table(_TABLE).select("*").order("id")
    if category is not None:
        query = query.eq("category", category.value)
    resp = query.execute()
    return [_from_row(r) for r in (resp.data or [])]


def get_program(program_id: str) -> SupportProgramDB | None:
    """Tek bir programı program_id'sine göre getirir."""
    resp = _client().table(_TABLE).select("*").eq("program_id", program_id).limit(1).execute()
    data = resp.data or []
    return _from_row(data[0]) if data else None


def match_programs(
    query_embedding: list[float],
    *,
    match_count: int = 5,
    category: Category | None = None,
) -> list[SupportProgramDB]:
    """Verilen embedding'e en yakın programları (kosinüs benzerliği) döner — RAG eşleştirmesi."""
    resp = _client().rpc(
        "match_programs",
        {
            "query_embedding": query_embedding,
            "match_count": match_count,
            "filter_category": category.value if category else None,
        },
    ).execute()
    return [_from_row(r) for r in (resp.data or [])]