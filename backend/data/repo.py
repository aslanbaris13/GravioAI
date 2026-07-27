"""Supabase (REST) tabanlı veri erişim katmanı.

Backend, Postgres'e doğrudan bağlanmak yerine Supabase REST API üzerinden
çalışır (service_role anahtarı ile). Vektör benzerlik araması `match_programs`
RPC fonksiyonu üzerinden yapılır.

Fonksiyonlar senkron; async route'lar bunları `run_in_threadpool` ile çağırır.
"""
import logging
from datetime import datetime, timezone
from functools import lru_cache

from pydantic import ValidationError
from supabase import Client, create_client

from core.config import get_settings
from models import Category, ProgramMatch, SupportProgram
from models.application import ApplicationRecord
from models.presentation import GeneratedPresentation, PresentationRecord
from models.session import SessionState

_TABLE = "programs"
logger = logging.getLogger(__name__)

_CHİLD = "program_chunks" #child
_PARENT = "program_parents" #parent
_SESSIONS = "user_sessions"
_PRESENTATIONS = "presentations"
_APPLICATIONS = "applications"
_INGESTION_RUNS = "ingestion_runs"

@lru_cache
def _client() -> Client:
    s = get_settings()
    return create_client(s.supabase_url, s.supabase_key)


def program_embedding_text(p: SupportProgram) -> str:
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


def _to_row(p: SupportProgram, embedding: list[float] | None = None) -> dict:
    """SupportProgram'yi DB satırına (İngilizce kolon adları) çevirir."""
    row = p.model_dump(mode="json")  # alan adları (alias değil), enum'lar string'e döner
    if embedding is not None:
        row["embedding"] = embedding
    return row


def _from_row(row: dict) -> SupportProgram:
    """DB satırını modele çevirir (fazladan kolonlar varsa yok sayılır).

    `embedding` alanı atılır: pgvector kolonu PostgREST üzerinden JSON listesi
    değil, düz metin ("[-0.001,...]") olarak döner ve model bunu doğrulayamaz.
    API tüketicileri zaten embedding'i kullanmıyor, bu yüzden parse etmek yerine
    (gereksiz 768 boyutlu veri de taşımamak için) alanı boş bırakıyoruz.
    """
    row = {**row, "embedding": None}
    return SupportProgram.model_validate(row)


def _from_row_safe(row: dict) -> SupportProgram | None:
    """`_from_row` ile aynı, ama eksik/bozuk zorunlu alanı olan (ör.
    `source_url` NULL — henüz connector'ı yazılmamış bazı ileriye dönük
    stub kayıtlarda görülüyor) bir satır tüm listeyi 500'e düşürmesin diye
    hatayı yutup None döner; çağıran taraf bu satırı atlar."""
    try:
        return _from_row(row)
    except ValidationError:
        logger.warning("program_row_invalid program_id=%s", row.get("program_id"), exc_info=True)
        return None


def upsert_programs(rows: list[dict]) -> int:
    """Hazır satırları (embedding dahil) toplu upsert eder, yazılan kayıt sayısını döner."""
    if not rows:
        return 0
    resp = _client().table(_TABLE).upsert(rows, on_conflict="program_id").execute()
    return len(resp.data or [])

def upsert_program_parents(rows: list[dict]) -> int:
    """program_parents tablosuna toplu upsert yapar."""
    
    if not rows:
        return 0

    par_resp= _client().table(_PARENT).upsert(rows,on_conflict="id").execute()
    return len(par_resp.data or [])
    
def upsert_program_chunks(rows: list[dict]) -> int:
    """program_chunks tablosuna toplu upsert yapar."""
    if not rows:
        return 0
    ch_resp= _client().table(_CHİLD).upsert(rows,on_conflict="id").execute()
    return len(ch_resp.data or [])


def log_ingestion_run(
    source: str,
    status: str,
    *,
    started_at: datetime,
    docs_found: int = 0,
    chunks_upserted: int = 0,
    error_msg: str | None = None,
) -> None:
    """Bir scrape/ingest çalıştırmasının sonucunu `ingestion_runs`'a yazar.

    Otomatik veri çekme işinin ne yaptığını (kaç program bulundu, hata var
    mı) sonradan görebilmek için — cron devreye alınmadan önce her
    çalıştırmayı burada gözlemleyeceğiz."""
    row = {
        "source": source,
        "status": status,
        "docs_found": docs_found,
        "chunks_upserted": chunks_upserted,
        "error_msg": error_msg,
        "started_at": started_at.isoformat(),
        "finished_at": datetime.now(timezone.utc).isoformat(),
    }
    _client().table(_INGESTION_RUNS).insert(row).execute()

def get_programs(category: Category | None = None) -> list[SupportProgram]:
    """Kategoriye göre (isteğe bağlı) tüm programları getirir."""
    query = _client().table(_TABLE).select("*").order("program_id")
    if category is not None:
        query = query.eq("category", category.value)
    resp = query.execute()
    return [p for r in (resp.data or []) if (p := _from_row_safe(r)) is not None]


def get_program(program_id: str) -> SupportProgram | None:
    """Tek bir programı program_id'sine göre getirir."""
    resp = _client().table(_TABLE).select("*").eq("program_id", program_id).limit(1).execute()
    data = resp.data or []
    return _from_row_safe(data[0]) if data else None


def match_programs(
    query_embedding: list[float],
    *,
    match_count: int = 5,
    category: Category | None = None,
) -> list[SupportProgram]:
    """Verilen embedding'e en yakın programları (kosinüs benzerliği) döner — RAG eşleştirmesi."""
    resp = _client().rpc(
        "match_programs",
        {
            "query_embedding": query_embedding,
            "match_count": match_count,
            "filter_category": category.value if category else None,
        },
    ).execute()
    return [p for r in (resp.data or []) if (p := _from_row_safe(r)) is not None]


def save_session(session_id: str, state: SessionState) -> None:
    """Bir oturumun profil + eşleşmelerini kaydeder (üzerine yazar)."""
    row = {
        "session_id": session_id,
        "profile": state.profile.model_dump(mode="json"),
        "matches": [m.model_dump(mode="json") for m in state.matches],
    }
    _client().table(_SESSIONS).upsert(row, on_conflict="session_id").execute()


def get_session(session_id: str) -> SessionState | None:
    """Bir oturumun kayıtlı profil + eşleşmelerini getirir; hiç yoksa None döner."""
    resp = (
        _client()
        .table(_SESSIONS)
        .select("*")
        .eq("session_id", session_id)
        .limit(1)
        .execute()
    )
    data = resp.data or []
    if not data:
        return None
    row = data[0]
    matches = [
        ProgramMatch.model_validate({**m, "program": {**m["program"], "embedding": None}})
        for m in (row.get("matches") or [])
    ]
    return SessionState(profile=row.get("profile") or {}, matches=matches)


def create_application(session_id: str, program_id: str, program_name: str) -> ApplicationRecord:
    """Bir oturumun bir programa başvuru sürecini başlatır ('taslak' durumunda).

    `applications` tablosunda `(session_id, program_id)` üzerinde unique kısıt
    var — aynı programa tekrar "başvuru hazırla" denirse (ör. sayfa yenileme
    sonrası tekrar tıklama) hata vermek yerine mevcut kaydı döner (upsert).
    """
    row = {"session_id": session_id, "program_id": program_id, "program_name": program_name}
    resp = (
        _client()
        .table(_APPLICATIONS)
        .upsert(row, on_conflict="session_id,program_id", ignore_duplicates=True)
        .execute()
    )
    data = resp.data or []
    if data:
        return ApplicationRecord.model_validate(data[0])
    # `ignore_duplicates=True` çakışan satır için veri döndürmez — mevcut kaydı ayrıca çekiyoruz.
    existing = (
        _client()
        .table(_APPLICATIONS)
        .select("*")
        .eq("session_id", session_id)
        .eq("program_id", program_id)
        .limit(1)
        .execute()
    )
    return ApplicationRecord.model_validate(existing.data[0])


def list_applications(session_id: str) -> list[ApplicationRecord]:
    """Bir oturumun tüm başvuru kayıtlarını (en yeni önce) getirir."""
    resp = (
        _client()
        .table(_APPLICATIONS)
        .select("*")
        .eq("session_id", session_id)
        .order("created_at", desc=True)
        .execute()
    )
    return [ApplicationRecord.model_validate(r) for r in (resp.data or [])]


def update_application(application_id: str, fields: dict) -> ApplicationRecord | None:
    """Bir başvuru kaydının durum/not/hatırlatma alanlarını günceller.

    `fields` yalnızca istemcinin gönderdiği (JSON'da açıkça belirtilmiş)
    alanları içermeli — çağıran taraf (routes.py) bunu `exclude_unset` ile
    üretir, yoksa `None` bir alanı yanlışlıkla temizleyebilir.
    """
    if not fields:
        return None
    resp = _client().table(_APPLICATIONS).update(fields).eq("id", application_id).execute()
    data = resp.data or []
    return ApplicationRecord.model_validate(data[0]) if data else None


def save_presentation(
    session_id: str, company_name: str, presentation: GeneratedPresentation
) -> PresentationRecord:
    """Üretilen bir sunumu arşive kaydeder ('Geçmiş Sunumlarım')."""
    row = {
        "session_id": session_id,
        "title": presentation.title,
        "subtitle": presentation.subtitle,
        "company_name": company_name,
        "slides": [s.model_dump(mode="json") for s in presentation.slides],
    }
    resp = _client().table(_PRESENTATIONS).insert(row).execute()
    return PresentationRecord.model_validate(resp.data[0])


def list_presentations(session_id: str) -> list[PresentationRecord]:
    """Bir oturumun daha önce ürettiği tüm sunumları (en yeni önce) getirir."""
    resp = (
        _client()
        .table(_PRESENTATIONS)
        .select("*")
        .eq("session_id", session_id)
        .order("created_at", desc=True)
        .execute()
    )
    return [PresentationRecord.model_validate(r) for r in (resp.data or [])]