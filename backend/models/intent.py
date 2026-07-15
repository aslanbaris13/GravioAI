"""Niyet sınıflandırma modelleri (SCRUM-107).

Orchestrator, her kullanıcı mesajını çalıştırmadan önce niyetini sınıflandırır
ve hangi ajan zincirini çalıştıracağına buna göre karar verir. Niyet sınıfları
ve routing kuralları `docs/chat-flow/03-prompt-akisi.md` içinde tasarlanmıştır.
"""
from enum import Enum

from pydantic import BaseModel, Field


class Intent(str, Enum):
    GREETING = "greeting"
    OFF_TOPIC = "off_topic"
    PROFILE_INFO = "profile_info"
    PROGRAM_QUESTION = "program_question"
    APPLY_REQUEST = "apply_request"


class IntentResult(BaseModel):
    """Niyet sınıflandırıcının çıktısı."""

    intent: Intent
    confidence: float = Field(ge=0.0, le=1.0, description="Sınıflandırmaya olan güven (0-1)")
