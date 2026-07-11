"""Orkestratör giriş/çıkış modelleri.

Orkestratör'ün tek yanıtı: çıkarılan profil + her aday program için uygunluk
değerlendirmesi + sohbet için kısa bir metin. Frontend bu yapıyı doğrudan
kullanabilir (program detayları + elig/conditions birlikte gelir).
"""
from pydantic import BaseModel

from .eligibility import EligibilityResult
from .profile import UserProfile
from .program import SupportProgram


class ConversationTurn(BaseModel):
    """Tek bir konuşma turu — role + içerik."""

    role: str  # "user" | "assistant"
    content: str


class ProgramMatch(BaseModel):
    """Bir aday program ve onun profile göre uygunluk değerlendirmesi."""

    program: SupportProgram
    eligibility: EligibilityResult


class AssistResult(BaseModel):
    """Orkestratör'ün uçtan uca yanıtı."""

    profile: UserProfile
    matches: list[ProgramMatch]
    reply: str
