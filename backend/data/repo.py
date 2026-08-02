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
from data.loader import load_programs
from models import Category, ProgramMatch, SupportProgram
from models.application import ApplicationRecord
from models.ingestion import IngestionRun
from models.presentation import GeneratedPresentation, PresentationRecord
from models.session import SessionState
from models.thread import ChatThreadSummary

_TABLE = "programs"
logger = logging.getLogger(__name__)

_CHİLD = "program_chunks" #child
_PARENT = "program_parents" #parent
_SESSIONS = "user_sessions"
_PRESENTATIONS = "presentations"
_APPLICATIONS = "applications"
_INGESTION_RUNS = "ingestion_runs"
_THREADS = "chat_threads"
_THREAD_MESSAGES = "chat_messages"

_THREAD_TITLE_MAX_LEN = 48

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


def list_ingestion_runs(limit: int = 20) -> list[IngestionRun]:
    """Son veri senkronizasyonu çalıştırmalarını (en yeni önce) getirir —
    panelde "veri ne zaman güncellendi" göstermek için kullanılır."""
    resp = (
        _client()
        .table(_INGESTION_RUNS)
        .select("*")
        .order("started_at", desc=True)
        .limit(limit)
        .execute()
    )
    return [IngestionRun.model_validate(r) for r in (resp.data or [])]


def _local_programs(category: Category | None = None) -> list[SupportProgram]:
    """Diskteki `data/programs/*.json` — Supabase'e ulaşılamadığında kullanılan
    yedek kaynak. Bu dosyalar programların resmî sayfalarından toplanmıştır
    (her kayıtta `source_url` ile), yani uydurma değil, yalnızca DB'ye
    yüklenmiş kopyadan daha eski olabilir."""
    programs = load_programs()
    if category is not None:
        programs = [p for p in programs if p.category == category.value]
    return sorted(programs, key=lambda p: p.program_id)


def get_programs(category: Category | None = None) -> list[SupportProgram]:
    """Kategoriye göre (isteğe bağlı) tüm programları getirir.

    Supabase erişilemezse (proje kapalı/silinmiş, ağ yok, anahtar geçersiz)
    program listesi tamamen boş kalmasın diye diskteki JSON'a düşülür —
    aksi halde ana sayfadaki vitrin ve program detayları çalışmaz."""
    try:
        query = _client().table(_TABLE).select("*").order("program_id")
        if category is not None:
            query = query.eq("category", category.value)
        resp = query.execute()
        return [p for r in (resp.data or []) if (p := _from_row_safe(r)) is not None]
    except Exception:
        logger.warning(
            "programs_db_unavailable — yerel JSON yedeğine düşülüyor (veri güncel olmayabilir)",
            exc_info=True,
        )
        return _local_programs(category)


def get_program(program_id: str) -> SupportProgram | None:
    """Tek bir programı program_id'sine göre getirir (DB yoksa yerel JSON'dan)."""
    try:
        resp = _client().table(_TABLE).select("*").eq("program_id", program_id).limit(1).execute()
        data = resp.data or []
        return _from_row_safe(data[0]) if data else None
    except Exception:
        logger.warning(
            "program_db_unavailable program_id=%s — yerel JSON yedeğine düşülüyor",
            program_id,
            exc_info=True,
        )
        return next((p for p in _local_programs() if p.program_id == program_id), None)


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


class NotOwnerError(Exception):
    """İstenen kayıt başka bir kullanıcıya ait. routes.py bunu 403'e çevirir."""


def claim_session_records(session_id: str, user_id: str) -> None:
    """`session_id`'ye ait ANONİM kayıtları bu kullanıcıya bağlar.

    Kullanıcı anonimken sohbet edip profil çıkarmış, sonra giriş yapmış
    olabilir; o veriyi kaybetmemek için giriş sonrası ilk erişimde sahiplenilir.

    `is_("user_id", "null")` filtresi kritik: yalnızca sahipsiz kayıtlar
    devralınabilir. Aksi halde başkasının `session_id`'sini bilen biri, giriş
    yapıp o kaydı kendine geçirebilirdi.
    """
    for table in (_SESSIONS, _APPLICATIONS, _PRESENTATIONS, _THREADS):
        try:
            (
                _client()
                .table(table)
                .update({"user_id": user_id})
                .eq("session_id", session_id)
                .is_("user_id", "null")
                .execute()
            )
        except Exception:
            logger.warning("claim_failed table=%s session_id=%s", table, session_id, exc_info=True)


def _owned_session_id(user_id: str) -> str | None:
    """Kullanıcının kendi oturum kaydının session_id'si — başka bir cihazdan
    girildiğinde (yerel session_id farklıyken) veriyi bulmayı sağlar."""
    resp = (
        _client()
        .table(_SESSIONS)
        .select("session_id")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .limit(1)
        .execute()
    )
    data = resp.data or []
    return data[0]["session_id"] if data else None


def save_session(session_id: str, state: SessionState, user_id: str | None = None) -> None:
    """Bir oturumun profil + eşleşmelerini kaydeder (üzerine yazar)."""
    row = {
        "session_id": session_id,
        "profile": state.profile.model_dump(mode="json"),
        "matches": [m.model_dump(mode="json") for m in state.matches],
    }
    if user_id:
        row["user_id"] = user_id
    _client().table(_SESSIONS).upsert(row, on_conflict="session_id").execute()


def get_session(session_id: str, user_id: str | None = None) -> SessionState | None:
    """Bir oturumun kayıtlı profil + eşleşmelerini getirir; hiç yoksa None döner.

    Girişli kullanıcıda: elindeki anonim kayıt önce sahiplenilir, sonra
    kullanıcının kendi kaydı aranır — böylece farklı bir cihazdan girildiğinde
    (yerel `session_id` başka olsa da) profil geri gelir.

    Anonim kullanıcıda: kayıt bir hesaba bağlanmışsa erişim reddedilir.
    """
    if user_id:
        claim_session_records(session_id, user_id)
        session_id = _owned_session_id(user_id) or session_id

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
    owner = row.get("user_id")
    if owner and owner != user_id:
        raise NotOwnerError(session_id)
    matches = [
        ProgramMatch.model_validate({**m, "program": {**m["program"], "embedding": None}})
        for m in (row.get("matches") or [])
    ]
    return SessionState(profile=row.get("profile") or {}, matches=matches)


def create_application(
    session_id: str, program_id: str, program_name: str, user_id: str | None = None
) -> ApplicationRecord:
    """Bir oturumun bir programa başvuru sürecini başlatır ('taslak' durumunda).

    `applications` tablosunda `(session_id, program_id)` üzerinde unique kısıt
    var — aynı programa tekrar "başvuru hazırla" denirse (ör. sayfa yenileme
    sonrası tekrar tıklama) hata vermek yerine mevcut kaydı döner (upsert).
    """
    row = {"session_id": session_id, "program_id": program_id, "program_name": program_name}
    if user_id:
        row["user_id"] = user_id
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


def list_applications(session_id: str, user_id: str | None = None) -> list[ApplicationRecord]:
    """Başvuru kayıtlarını (en yeni önce) getirir.

    Girişli kullanıcıda oturum yerine HESAP üzerinden listelenir: farklı
    cihazlardan başlatılmış başvurular da tek listede toplanır.
    """
    query = _client().table(_APPLICATIONS).select("*")
    if user_id:
        claim_session_records(session_id, user_id)
        query = query.eq("user_id", user_id)
    else:
        # Anonim: yalnızca sahipsiz kayıtlar görülebilir.
        query = query.eq("session_id", session_id).is_("user_id", "null")
    resp = query.order("created_at", desc=True).execute()
    return [ApplicationRecord.model_validate(r) for r in (resp.data or [])]


def update_application(
    application_id: str, fields: dict, user_id: str | None = None
) -> ApplicationRecord | None:
    """Bir başvuru kaydının durum/not/hatırlatma alanlarını günceller.

    `fields` yalnızca istemcinin gönderdiği (JSON'da açıkça belirtilmiş)
    alanları içermeli — çağıran taraf (routes.py) bunu `exclude_unset` ile
    üretir, yoksa `None` bir alanı yanlışlıkla temizleyebilir.
    """
    if not fields:
        return None

    # Bu uç nokta yalnızca application_id alıyor — sahiplik kontrolü olmadan
    # id'yi bilen herkes başkasının başvurusunu güncelleyebilirdi.
    current = _client().table(_APPLICATIONS).select("user_id").eq("id", application_id).limit(1).execute()
    rows = current.data or []
    if not rows:
        return None
    owner = rows[0].get("user_id")
    if owner != user_id:
        # Sahipli kayda yabancı erişimi de, anonim kayda girişli erişimi de
        # reddediyoruz; ikincisi ancak devralma sonrası mümkün olmalı.
        raise NotOwnerError(application_id)

    resp = _client().table(_APPLICATIONS).update(fields).eq("id", application_id).execute()
    data = resp.data or []
    return ApplicationRecord.model_validate(data[0]) if data else None


def save_presentation(
    session_id: str,
    company_name: str,
    presentation: GeneratedPresentation,
    user_id: str | None = None,
) -> PresentationRecord:
    """Üretilen bir sunumu arşive kaydeder ('Geçmiş Sunumlarım')."""
    row = {
        "session_id": session_id,
        "title": presentation.title,
        "subtitle": presentation.subtitle,
        "company_name": company_name,
        "slides": [s.model_dump(mode="json") for s in presentation.slides],
    }
    if user_id:
        row["user_id"] = user_id
    resp = _client().table(_PRESENTATIONS).insert(row).execute()
    return PresentationRecord.model_validate(resp.data[0])


def list_presentations(session_id: str, user_id: str | None = None) -> list[PresentationRecord]:
    """Daha önce üretilmiş sunumları (en yeni önce) getirir.

    Girişli kullanıcıda hesap üzerinden listelenir (bkz. list_applications).
    """
    query = _client().table(_PRESENTATIONS).select("*")
    if user_id:
        claim_session_records(session_id, user_id)
        query = query.eq("user_id", user_id)
    else:
        query = query.eq("session_id", session_id).is_("user_id", "null")
    resp = query.order("created_at", desc=True).execute()
    return [PresentationRecord.model_validate(r) for r in (resp.data or [])]


def create_thread(session_id: str, user_id: str | None = None) -> ChatThreadSummary:
    """Yeni bir sohbet thread'i açar — başlık ilk kullanıcı mesajı gelince
    `set_thread_title_if_untitled` ile doldurulur, burada boş başlar."""
    row = {"session_id": session_id}
    if user_id:
        row["user_id"] = user_id
    resp = _client().table(_THREADS).insert(row).execute()
    return ChatThreadSummary.model_validate(resp.data[0])


def list_threads(session_id: str, user_id: str | None = None) -> list[ChatThreadSummary]:
    """Sohbet geçmişini (en son güncellenen önce) getirir.

    Girişli kullanıcıda hesap üzerinden listelenir (bkz. list_applications).
    """
    query = _client().table(_THREADS).select("id,title,created_at,updated_at")
    if user_id:
        claim_session_records(session_id, user_id)
        query = query.eq("user_id", user_id)
    else:
        query = query.eq("session_id", session_id).is_("user_id", "null")
    resp = query.order("updated_at", desc=True).execute()
    return [ChatThreadSummary.model_validate(r) for r in (resp.data or [])]


def _thread_belongs_to(thread_id: str, session_id: str, user_id: str | None) -> bool:
    """Bir mesaj isteğinin, başkasının thread'ine yazmadığını/okumadığını
    doğrular — `thread_id` tahmin edilebilir bir UUID olsa da sahiplik
    kontrolü olmadan başka bir oturumun sohbetine mesaj eklenebilirdi."""
    resp = _client().table(_THREADS).select("session_id,user_id").eq("id", thread_id).limit(1).execute()
    data = resp.data or []
    if not data:
        return False
    row = data[0]
    if user_id:
        return row.get("user_id") == user_id
    return row.get("session_id") == session_id and not row.get("user_id")


def get_thread_messages(thread_id: str, session_id: str, user_id: str | None = None) -> list[dict]:
    """Bir thread'in tüm mesajlarını (eskiden yeniye) getirir."""
    if not _thread_belongs_to(thread_id, session_id, user_id):
        return []
    resp = (
        _client()
        .table(_THREAD_MESSAGES)
        .select("role,data,created_at")
        .eq("thread_id", thread_id)
        .order("created_at")
        .execute()
    )
    return resp.data or []


def append_thread_messages(
    thread_id: str, session_id: str, messages: list[dict], user_id: str | None = None
) -> bool:
    """Bir thread'e bir veya daha fazla mesaj ekler ve `updated_at`'i günceller.

    İlk kullanıcı mesajı geldiğinde, thread henüz başlıksızsa (yeni açılmış),
    o mesajın metninden kısa bir başlık türetilip aynı anda kaydedilir —
    kenar çubuğundaki liste "Yeni sohbet" gibi anlamsız girişlerle dolmasın.
    """
    if not _thread_belongs_to(thread_id, session_id, user_id):
        return False
    rows = [{"thread_id": thread_id, "role": m["role"], "data": m["data"]} for m in messages]
    if rows:
        _client().table(_THREAD_MESSAGES).insert(rows).execute()

    update = {"updated_at": datetime.now(timezone.utc).isoformat()}
    first_user_text = next(
        (m["data"].get("text") for m in messages if m["role"] == "user" and m["data"].get("text")), None
    )
    if first_user_text:
        existing = _client().table(_THREADS).select("title").eq("id", thread_id).limit(1).execute()
        if existing.data and not existing.data[0].get("title"):
            title = first_user_text.strip()[:_THREAD_TITLE_MAX_LEN]
            update["title"] = title
    _client().table(_THREADS).update(update).eq("id", thread_id).execute()
    return True


def rename_thread(thread_id: str, session_id: str, title: str, user_id: str | None = None) -> bool:
    """Bir thread'in başlığını kullanıcı isteğiyle değiştirir (otomatik
    türetilen başlığın üzerine yazar)."""
    if not _thread_belongs_to(thread_id, session_id, user_id):
        return False
    clean_title = title.strip()[:_THREAD_TITLE_MAX_LEN]
    if not clean_title:
        return False
    _client().table(_THREADS).update({"title": clean_title}).eq("id", thread_id).execute()
    return True


def delete_thread(thread_id: str, session_id: str, user_id: str | None = None) -> bool:
    """Bir thread'i (ve `chat_messages` kaydındaki tüm mesajlarını, cascade ile) siler."""
    if not _thread_belongs_to(thread_id, session_id, user_id):
        return False
    _client().table(_THREADS).delete().eq("id", thread_id).execute()
    return True