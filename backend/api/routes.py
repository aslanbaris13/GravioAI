"""HTTP uç noktaları."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..core.llm import LLMClient, LLMMessage, get_llm_client

router = APIRouter()


@router.get("/health")
async def health() -> dict:
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
