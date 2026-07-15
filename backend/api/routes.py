"""HTTP uç noktaları."""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel

from ..agents import (
    ApplicationAgent,
    EligibilityAgent,
    Orchestrator,
    ProfileExtractor,
)
from ..core.embedder import get_embedding_client
from ..core.llm import LLMClient, LLMMessage, get_llm_client
from ..data import repo
from ..models import (
    ApplicationDraft,
    AssistResult,
    Category,
    ConversationTurn,
    EligibilityResult,
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


@router.post("/match", response_model=list[SupportProgram], response_model_by_alias=False)
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


@router.post("/profile", response_model=UserProfile)
async def extract_profile(body: ProfileRequest) -> UserProfile:
    """Serbest metinden yapılandırılmış kullanıcı profili çıkarır (Profil Çıkarma Ajanı)."""
    agent = ProfileExtractor()
    return await agent.run(body.message)


class EligibilityRequest(BaseModel):
    profile: UserProfile
    program_id: str


@router.post("/eligibility", response_model=EligibilityResult)
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


@router.post("/application", response_model=ApplicationDraft)
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


@router.post("/assist", response_model=AssistResult, response_model_by_alias=False)
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


@router.post("/chat", response_model=ChatResponse)
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
