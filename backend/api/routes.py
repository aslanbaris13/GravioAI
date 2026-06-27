"""HTTP uç noktaları."""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel

from ..agents import ProfileExtractor
from ..core.embeddings import embed_text
from ..core.llm import LLMClient, LLMMessage, get_llm_client
from ..data import repo
from ..models import Category, SupportProgram, UserProfile

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@router.get("/programs", response_model=list[SupportProgram])
async def list_programs(category: Category | None = None) -> list[SupportProgram]:
    """Destek programlarını listeler; opsiyonel kategori filtresi."""
    return await run_in_threadpool(repo.get_programs, category)


@router.get("/programs/{program_id}", response_model=SupportProgram)
async def read_program(program_id: str) -> SupportProgram:
    program = await run_in_threadpool(repo.get_program, program_id)
    if program is None:
        raise HTTPException(status_code=404, detail="Program bulunamadı")
    return program


class MatchRequest(BaseModel):
    query: str
    limit: int = 5
    category: Category | None = None


@router.post("/match", response_model=list[SupportProgram])
async def match(body: MatchRequest) -> list[SupportProgram]:
    """Serbest metin sorgusuna en yakın programları döner (vektör araması / RAG)."""
    embedding = await run_in_threadpool(embed_text, body.query)
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
