"""HTTP uç noktaları."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..core.llm import LLMClient, LLMMessage, get_llm_client
from ..data.loader import filter_programs, get_program
from ..models import Category, SupportProgram

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@router.get("/programs", response_model=list[SupportProgram])
async def list_programs(category: Category | None = None) -> list[SupportProgram]:
    """Destek programlarını listeler; opsiyonel kategori filtresi."""
    return filter_programs(category)


@router.get("/programs/{program_id}", response_model=SupportProgram)
async def read_program(program_id: str) -> SupportProgram:
    program = get_program(program_id)
    if program is None:
        raise HTTPException(status_code=404, detail="Program bulunamadı")
    return program


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
