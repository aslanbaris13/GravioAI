"""HTTP uç noktaları."""
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import Response
from pydantic import BaseModel

from ..agents import (
    ApplicationAgent,
    EligibilityAgent,
    Orchestrator,
    ProfileExtractor,
    ReportWriterAgent,
)
from ..core.docx_export import build_report_docx
from ..core.embedder import get_embedding_client
from ..core.llm import LLMClient, LLMMessage, get_llm_client
from ..core.rate_limit import enforce_llm_rate_limit
from ..data import repo, report_schema_loader
from ..models import (
    ApplicationDraft,
    AssistResult,
    Category,
    ConversationTurn,
    EligibilityResult,
    GeneratedReport,
    ReportSchema,
    SessionState,
    SupportProgram,
    UserProfile,
)

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@router.get("/programs", response_model=list[SupportProgram], response_model_by_alias=False)
async def list_programs(category: Category | None = None) -> list[SupportProgram]:
    """Destek programlarını listeler; opsiyonel kategori filtresi."""
    return await run_in_threadpool(repo.get_programs, category)


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


class AssistRequest(BaseModel):
    message: str
    history: list[ConversationTurn] = []


@router.post(
    "/assist",
    response_model=AssistResult,
    response_model_by_alias=False,
    dependencies=[Depends(enforce_llm_rate_limit)],
)
async def assist(body: AssistRequest) -> AssistResult:
    """Uçtan uca akış: mesaj + geçmiş → profil → eşleştirme → uygunluk (Orkestratör)."""
    return await Orchestrator().run(body.message, history=body.history or None)


@router.get("/session/{session_id}", response_model=SessionState, response_model_by_alias=False)
async def read_session(session_id: str) -> SessionState:
    """Bir oturumun kayıtlı profil + eşleşmelerini getirir; hiç kayıt yoksa boş durum döner."""
    state = await run_in_threadpool(repo.get_session, session_id)
    return state or SessionState()


@router.put("/session/{session_id}")
async def write_session(session_id: str, body: SessionState) -> dict:
    """Bir oturumun profil + eşleşmelerini kaydeder (üzerine yazar)."""
    await run_in_threadpool(repo.save_session, session_id, body)
    return {"status": "ok"}


class ChatRequest(BaseModel):
    message: str


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
    """Geçici uç nokta — LLM katmanının uçtan uca çalıştığını doğrular.

    İleride orkestratör ajanına bağlanacak.
    """
    reply = await llm.chat(
        [LLMMessage(role="user", content=body.message)],
        system="Sen GravioAI'sın; Türkiye'deki girişim ve KOBİ'lere destek/hibe konusunda yardımcı olan bir asistansın. Kısa ve net cevap ver.",
    )
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

    # Content-Disposition header'ı yalnızca Latin-1 kabul eder; Türkçe
    # karakterler (İ, ş, ğ...) içeren dosya adları bunu kırar. ASCII bir
    # yedek isim + RFC 5987 filename* (UTF-8) ile hem eski hem yeni
    # istemcilerde doğru dosya adı görünür.
    safe_stem = report.program_name.encode("ascii", "ignore").decode("ascii").replace(" ", "-") or "Rapor"
    ascii_filename = f"{safe_stem}-Rapor.docx"
    utf8_filename = quote(f"{report.program_name.replace(' ', '-')}-Rapor.docx")

    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{ascii_filename}"; filename*=UTF-8\'\'{utf8_filename}'
            )
        },
    )
