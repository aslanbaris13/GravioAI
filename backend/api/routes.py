"""HTTP uç noktaları."""
import json
import logging
from core import document_parser
from core.docx_export import build_report_docx
from datetime import date
from urllib.parse import quote

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel

from agents import (
    ApplicationAgent,
    EligibilityAgent,
    Orchestrator,
    PresentationWriterAgent,
    ProfileExtractor,
    ReportWriterAgent,
)

from core.embedder import get_embedding_client
from core.llm import LLMClient, LLMMessage, get_llm_client
from core.pptx_export import build_presentation_pptx
from core.auth import current_user_id
from core.rate_limit import enforce_llm_rate_limit
from data import repo, report_schema_loader
from models import (
    ApplicationDraft,
    ApplicationRecord,
    ApplicationTrackingStatus,
    AssistResult,
    Category,
    ChatThreadMessage,
    ChatThreadMessageCreate,
    ChatThreadSummary,
    ConversationTurn,
    EligibilityResult,
    GeneratedPresentation,
    GeneratedReport,
    IngestionRun,
    PresentationRecord,
    ReportSchema,
    SessionState,
    SupportProgram,
    UserProfile)

router = APIRouter()
logger = logging.getLogger(__name__)


def _content_disposition(name_stem: str, suffix: str, extension: str) -> str:
    """Dosya indirme header'ı üretir. Content-Disposition yalnızca Latin-1
    kabul eder; Türkçe karakterler (İ, ş, ğ...) bunu kırar — ASCII bir yedek
    isim + RFC 5987 filename* (UTF-8) ile hem eski hem yeni istemcilerde
    doğru dosya adı görünür."""
    safe_stem = name_stem.encode("ascii", "ignore").decode("ascii").replace(" ", "-") or "Belge"
    ascii_filename = f"{safe_stem}-{suffix}.{extension}"
    utf8_filename = quote(f"{name_stem.replace(' ', '-')}-{suffix}.{extension}")
    return f"attachment; filename=\"{ascii_filename}\"; filename*=UTF-8''{utf8_filename}"


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@router.get("/programs", response_model=list[SupportProgram], response_model_by_alias=False)
async def list_programs(category: Category | None = None) -> list[SupportProgram]:
    """Destek programlarını listeler; opsiyonel kategori filtresi."""
    return await run_in_threadpool(repo.get_programs, category)


@router.get("/ingestion-runs", response_model=list[IngestionRun], response_model_by_alias=False)
async def list_ingestion_runs(limit: int = 20) -> list[IngestionRun]:
    """Son veri senkronizasyonu (scrape + ingest) çalıştırmalarını getirir —
    "veri ne zaman güncellendi" bilgisini panelde göstermek için."""
    return await run_in_threadpool(repo.list_ingestion_runs, limit)


@router.get("/programs/{program_id}", response_model=SupportProgram, response_model_by_alias=False)
async def read_program(program_id: str) -> SupportProgram:
    program = await run_in_threadpool(repo.get_program, program_id)
    if program is None:
        raise HTTPException(status_code=404, detail="Program bulunamadı")
    return program


class MatchRequest(BaseModel):
    query: str
    limit: int = 5
    category: Category | None = None


@router.post(
    "/match",
    response_model=list[SupportProgram],
    response_model_by_alias=False,
    dependencies=[Depends(enforce_llm_rate_limit)],
)
async def match(body: MatchRequest) -> list[SupportProgram]:
    """Serbest metin sorgusuna en yakın programları döner (vektör araması / RAG)."""
    embedding = await get_embedding_client().embed_text(body.query)
    return await run_in_threadpool(
        lambda: repo.match_programs(
            embedding, match_count=body.limit, category=body.category
        )
    )


class ProfileRequest(BaseModel):
    message: str


@router.post("/profile", response_model=UserProfile, dependencies=[Depends(enforce_llm_rate_limit)])
async def extract_profile(body: ProfileRequest) -> UserProfile:
    """Serbest metinden yapılandırılmış kullanıcı profili çıkarır (Profil Çıkarma Ajanı)."""
    agent = ProfileExtractor()
    return await agent.run(body.message)


@router.post(
    "/profile/parse-document",
    response_model=UserProfile,
    dependencies=[Depends(enforce_llm_rate_limit)],
)
async def parse_profile_document(file: UploadFile = File(...)) -> UserProfile:
    """CV/şirket dokümanından (PDF/DOCX/TXT) yapılandırılmış profil çıkarır.

    Dosyayı düz metne çevirir (`document_parser.extract_text`), sonra var olan
    Profil Çıkarma Ajanı'na aynen serbest sohbet metni gibi verir — yeni bir
    çıkarım mantığı gerekmez.
    """
    raw = await file.read()
    try:
        text = await run_in_threadpool(document_parser.extract_text, raw, file.filename or "")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    agent = ProfileExtractor()
    return await agent.run(text)


class EligibilityRequest(BaseModel):
    profile: UserProfile
    program_id: str


@router.post(
    "/eligibility",
    response_model=EligibilityResult,
    dependencies=[Depends(enforce_llm_rate_limit)],
)
async def evaluate_eligibility(body: EligibilityRequest) -> EligibilityResult:
    """Bir profili belirli bir programa karşı değerlendirir (Uygunluk Ajanı)."""
    program = await run_in_threadpool(repo.get_program, body.program_id)
    if program is None:
        raise HTTPException(status_code=404, detail="Program bulunamadı")
    agent = EligibilityAgent()
    return await agent.run(body.profile, program)


class ApplicationRequest(BaseModel):
    profile: UserProfile
    program_id: str


@router.post(
    "/application",
    response_model=ApplicationDraft,
    dependencies=[Depends(enforce_llm_rate_limit)],
)
async def draft_application(body: ApplicationRequest) -> ApplicationDraft:
    """Bir profil + program için başvuru taslağı üretir (Başvuru Ajanı)."""
    program = await run_in_threadpool(repo.get_program, body.program_id)
    if program is None:
        raise HTTPException(status_code=404, detail="Program bulunamadı")
    agent = ApplicationAgent()
    return await agent.run(body.profile, program)


class ApplicationCreateRequest(BaseModel):
    session_id: str
    program_id: str
    program_name: str


@router.post("/applications", response_model=ApplicationRecord, response_model_by_alias=False)
async def start_application(
    body: ApplicationCreateRequest, user_id: str | None = Depends(current_user_id)
) -> ApplicationRecord:
    """Bir programa başvuru sürecini başlatır — Panelim/Başvurularım'daki durum
    takibi kaydı (`/application` ile karıştırılmamalı; o LLM ile plan/belge
    taslağı üretir, bu ise `applications` tablosunda kalıcı bir kayıt açar).
    Aynı program için tekrar çağrılırsa mevcut kaydı döner (upsert)."""
    return await run_in_threadpool(
        repo.create_application, body.session_id, body.program_id, body.program_name, user_id
    )


@router.get("/applications", response_model=list[ApplicationRecord], response_model_by_alias=False)
async def get_applications(
    session_id: str, user_id: str | None = Depends(current_user_id)
) -> list[ApplicationRecord]:
    """Başvuru takibi kayıtlarını getirir (girişliyse hesap üzerinden)."""
    return await run_in_threadpool(repo.list_applications, session_id, user_id)


class ApplicationUpdateRequest(BaseModel):
    status: ApplicationTrackingStatus | None = None
    note: str | None = None
    reminder_date: date | None = None


@router.patch("/applications/{application_id}", response_model=ApplicationRecord, response_model_by_alias=False)
async def patch_application(
    application_id: str,
    body: ApplicationUpdateRequest,
    user_id: str | None = Depends(current_user_id),
) -> ApplicationRecord:
    """Bir başvuru kaydının durumunu/notunu/hatırlatmasını günceller.

    Yalnızca istekte açıkça gönderilen alanlar güncellenir (`exclude_unset`) —
    yoksa gönderilmeyen bir alan `None` sanılıp yanlışlıkla temizlenebilir.
    """
    fields = body.model_dump(exclude_unset=True, exclude_none=True, mode="json")
    updated = await run_in_threadpool(repo.update_application, application_id, fields, user_id)
    if updated is None:
        raise HTTPException(status_code=404, detail="Başvuru kaydı bulunamadı")
    return updated


class AssistRequest(BaseModel):
    message: str
    history: list[ConversationTurn] = []
    session_id: str | None = None


@router.post(
    "/assist",
    response_model=AssistResult,
    response_model_by_alias=False,
    dependencies=[Depends(enforce_llm_rate_limit)],
)
async def assist(body: AssistRequest) -> AssistResult:
    """Uçtan uca akış: mesaj + geçmiş → profil → eşleştirme → uygunluk (Orkestratör).

    `session_id` verilirse, Orkestratör turu bitirdikten sonra profil +
    eşleşmeleri otomatik olarak hafızaya (user_sessions) kaydeder.
    """
    return await Orchestrator().run(
        body.message, history=body.history or None, session_id=body.session_id
    )


@router.post(
    "/assist/stream",
    dependencies=[Depends(enforce_llm_rate_limit)],
)
async def assist_stream(body: AssistRequest) -> StreamingResponse:
    """`/assist` ile aynı akış, ama yanıt metni Server-Sent Events (SSE) ile
    token token gönderilir. `/assist` bu uç noktadan etkilenmez, ayrı ve ek
    bir yoldur (bkz. `Orchestrator.run_stream`)."""

    async def event_source():
        async for event in Orchestrator().run_stream(
            body.message, history=body.history or None, session_id=body.session_id
        ):
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

    return StreamingResponse(event_source(), media_type="text/event-stream")


@router.get("/session/{session_id}", response_model=SessionState, response_model_by_alias=False)
async def read_session(
    session_id: str, user_id: str | None = Depends(current_user_id)
) -> SessionState:
    """Bir oturumun kayıtlı profil + eşleşmelerini getirir; hiç kayıt yoksa boş durum döner."""
    state = await run_in_threadpool(repo.get_session, session_id, user_id)
    return state or SessionState()


@router.put("/session/{session_id}")
async def write_session(
    session_id: str, body: SessionState, user_id: str | None = Depends(current_user_id)
) -> dict:
    """Bir oturumun profil + eşleşmelerini kaydeder (üzerine yazar)."""
    await run_in_threadpool(repo.save_session, session_id, body, user_id)
    return {"status": "ok"}


class ThreadCreateRequest(BaseModel):
    session_id: str


@router.post("/threads", response_model=ChatThreadSummary, response_model_by_alias=False)
async def create_thread(
    body: ThreadCreateRequest, user_id: str | None = Depends(current_user_id)
) -> ChatThreadSummary:
    """Yeni bir sohbet thread'i açar (kenar çubuğundaki sohbet geçmişi).
    "Yeni sohbet" tıklanınca değil, kullanıcı ilk mesajını gönderince
    çağrılır — böylece hiç kullanılmayan boş sohbetler geçmişi doldurmaz."""
    return await run_in_threadpool(repo.create_thread, body.session_id, user_id)


@router.get("/threads", response_model=list[ChatThreadSummary], response_model_by_alias=False)
async def get_threads(
    session_id: str, user_id: str | None = Depends(current_user_id)
) -> list[ChatThreadSummary]:
    """Sohbet geçmişini getirir (girişliyse hesap üzerinden)."""
    return await run_in_threadpool(repo.list_threads, session_id, user_id)


@router.get("/threads/{thread_id}/messages", response_model=list[ChatThreadMessage], response_model_by_alias=False)
async def get_thread_messages(
    thread_id: str, session_id: str, user_id: str | None = Depends(current_user_id)
) -> list[ChatThreadMessage]:
    """Bir thread'in tüm mesajlarını getirir — sohbete geri dönüldüğünde ekranı
    doldurmak için. Başka bir oturuma/kullanıcıya ait thread'e erişim boş liste döner."""
    return await run_in_threadpool(repo.get_thread_messages, thread_id, session_id, user_id)


@router.post("/threads/{thread_id}/messages")
async def add_thread_messages(
    thread_id: str,
    session_id: str,
    body: list[ChatThreadMessageCreate],
    user_id: str | None = Depends(current_user_id),
) -> dict:
    """Bir thread'e bir sohbet turunun mesaj(lar)ını ekler. Frontend, akış
    (stream) bittikten sonra o turda oluşan mesajları burada toplu kaydeder —
    her token için değil, tur başına bir çağrı."""
    messages = [{"role": m.role, "data": m.data} for m in body]
    ok = await run_in_threadpool(repo.append_thread_messages, thread_id, session_id, messages, user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Sohbet kaydı bulunamadı")
    return {"status": "ok"}


GRAVIOAI_ASSISTANT_SYSTEM_PROMPT = """Sen GravioAI'nin tanıtım asistanısın (anasayfadaki sohbet widget'ında çalışıyorsun). Görevin, ziyaretçilere GravioAI'nin ne olduğunu, nasıl çalıştığını ve onlara ne kazandıracağını anlatmak — kısa, net ve samimi bir dille.

GRAVIOAI HAKKINDA GERÇEK BİLGİLER (yalnızca bunlara dayan, uydurma):
- GravioAI, Türkiye'deki KOBİ'ler ve girişimler için devlet ve özel sektör destek/hibe/kredi programlarını (KOSGEB, TÜBİTAK, İŞKUR, Ticaret Bakanlığı, Kalkınma Ajansları, Teknoparklar, Turizm Tanıtım Ajansı ve daha fazlası) bulan, uygunluğunu kontrol eden ve başvuru hazırlığını (taslak belge, iş planı, gerekli evrak listesi) otomatikleştiren bir platform.
- Üç adımda çalışır: (1) İşletmeni sohbet ya da formla anlat, (2) Sana uygun programları saniyeler içinde gör, (3) Uygunluğunu kontrol edip başvuru taslağını hazırla.
- Şu an ücretsiz kullanılabiliyor ("Ücretsiz başla").
- Giriş yapmadan (misafir olarak) da sohbet edip eşleşmelerini görebilirsin; hesap açarsan profilini ve başvurularını farklı cihazlardan takip edebilirsin.
- Öneriler resmî kaynaklara dayanır ve "son güncelleme" tarihiyle gösterilir — yine de başvuru göndermeden önce bilgiyi doğrulaman önerilir.
- Bu widget üzerinden kişisel/finansal bilgi paylaşmana gerek yok; detaylı profil oluşturma tam sohbet ekranında yapılır.

KURALLAR:
- Yalnızca yukarıdaki bilgiye dayan. Bilmediğin bir şey (fiyatlandırma detayı, hukuki garanti, spesifik program sayısı/oranı vb.) sorulursa uydurma; bilmediğini söyle.
- Kullanıcı KENDİ işletmesi için uygun destek/hibe/eşleşme sormaya başlarsa (ör. "bana hangi destekler uygun", "KOSGEB hibesine başvurabilir miyim"), bunu burada YANITLAMA — bunun gerçek eşleştirme sohbetinde (tam sohbet ekranında) yapılması gerektiğini kısaca söyle ve oraya yönlendir.
- Kısa tut (2-4 cümle), Türkçe yaz, gereksiz süslemeden kaçın."""


class ChatRequest(BaseModel):
    message: str
    history: list[ConversationTurn] = []


class ChatResponse(BaseModel):
    reply: str


@router.post(
    "/chat",
    response_model=ChatResponse,
    dependencies=[Depends(enforce_llm_rate_limit)],
)
async def chat(
    body: ChatRequest,
    llm: LLMClient = Depends(get_llm_client),
) -> ChatResponse:
    """Anasayfadaki sohbet widget'ının tanıtım asistanı — GravioAI'nin ne
    olduğu/nasıl çalıştığı hakkında serbest soruları, sabit ve doğrulanmış bir
    bilgiye (yukarıdaki sistem promptu) dayanarak yanıtlar. Gerçek işletme
    eşleştirmesi burada yapılmaz — Orkestratör'ün `/assist` akışına bırakılır.
    """
    messages = [LLMMessage(role=t.role, content=t.content) for t in body.history]
    messages.append(LLMMessage(role="user", content=body.message))
    reply = await llm.chat(messages, system=GRAVIOAI_ASSISTANT_SYSTEM_PROMPT, max_tokens=512)
    return ChatResponse(reply=reply)


@router.get("/report-schemas", response_model=list[ReportSchema])
async def list_report_schemas() -> list[ReportSchema]:
    """Rapor üretimi için hazır gereksinim şablonu bulunan programları listeler."""
    return await run_in_threadpool(report_schema_loader.load_report_schemas)


@router.get("/report-schemas/resolve", response_model=ReportSchema | None)
async def resolve_report_schema(program_title: str) -> ReportSchema | None:
    """Bir programın başlığından hangi rapor şemasının eşleştiğini bulur —
    eşleşme yoksa null döner (arayüz bunu "henüz hazır değil" olarak gösterir)."""
    return await run_in_threadpool(
        report_schema_loader.resolve_report_schema_for_program, program_title
    )


@router.get("/report-schemas/{key}", response_model=ReportSchema)
async def read_report_schema(key: str) -> ReportSchema:
    schema = await run_in_threadpool(report_schema_loader.get_report_schema, key)
    if schema is None:
        raise HTTPException(status_code=404, detail="Rapor şeması bulunamadı")
    return schema


class GenerateReportRequest(BaseModel):
    schema_key: str
    profile: UserProfile
    # section_id -> {field_key: value}
    field_values: dict[str, dict[str, str]] = {}


@router.post(
    "/reports/generate",
    response_model=GeneratedReport,
    dependencies=[Depends(enforce_llm_rate_limit)],
)
async def generate_report(body: GenerateReportRequest) -> GeneratedReport:
    """Bölüm bölüm rapor içeriği üretir (Rapor Yazma Ajanı)."""
    schema = await run_in_threadpool(report_schema_loader.get_report_schema, body.schema_key)
    if schema is None:
        raise HTTPException(status_code=404, detail="Rapor şeması bulunamadı")
    agent = ReportWriterAgent()
    return await agent.write_report(schema, body.profile, body.field_values)


@router.post("/reports/export-docx")
async def export_report_docx(report: GeneratedReport) -> Response:
    """Üretilmiş bir raporu düzenlenebilir .docx dosyası olarak döner."""
    content = await run_in_threadpool(build_report_docx, report)
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": _content_disposition(report.program_name, "Rapor", "docx")},
    )


class GeneratePresentationRequest(BaseModel):
    profile: UserProfile
    company_name: str = ""
    extra_context: str = ""
    session_id: str | None = None


@router.post(
    "/presentations/generate",
    response_model=GeneratedPresentation,
    dependencies=[Depends(enforce_llm_rate_limit)],
)
async def generate_presentation(body: GeneratePresentationRequest) -> GeneratedPresentation:
    """Sabit slayt iskeletinden, profile özel bir sunum üretir (Sunum Ajanı).

    `session_id` verilirse, üretilen sunum "Geçmiş Sunumlarım" arşivine de
    kaydedilir — bu en iyi çaba (best-effort): arşivleme başarısız olsa bile
    kullanıcı üretilen sunumu görüp indirebilmeli.
    """
    agent = PresentationWriterAgent()
    result = await agent.write_presentation(body.profile, body.company_name, body.extra_context)
    if body.session_id:
        try:
            await run_in_threadpool(repo.save_presentation, body.session_id, body.company_name, result)
        except Exception:  # noqa: BLE001 — arşivleme hatası kullanıcıyı etkilememeli
            logger.exception("presentation_save_failed session_id=%s", body.session_id)
    return result


@router.get(
    "/presentations",
    response_model=list[PresentationRecord],
    response_model_by_alias=False,
)
async def get_presentations(
    session_id: str, user_id: str | None = Depends(current_user_id)
) -> list[PresentationRecord]:
    """Daha önce üretilmiş sunumları getirir (girişliyse hesap üzerinden)."""
    return await run_in_threadpool(repo.list_presentations, session_id, user_id)


@router.post("/presentations/export-pptx")
async def export_presentation_pptx(presentation: GeneratedPresentation) -> Response:
    """Üretilmiş bir sunumu düzenlenebilir .pptx dosyası olarak döner."""
    content = await run_in_threadpool(build_presentation_pptx, presentation)
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": _content_disposition(presentation.title, "Sunum", "pptx")},
    )
