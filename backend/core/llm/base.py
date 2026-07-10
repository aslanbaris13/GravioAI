"""Sağlayıcı-bağımsız LLM arayüzü.

Tüm ajanlar bu arayüz üzerinden konuşur; somut sağlayıcı (Anthropic, Gemini,
OpenAI...) `factory.get_llm_client` ile config'ten seçilir. Model/sağlayıcı
değişse bile ajan kodu değişmez.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Literal, Optional
from models.program import ExtractedSupportInfo

Role = Literal["user", "assistant"]


@dataclass
class LLMMessage:
    role: Role
    content: str


class LLMClient(ABC):
    """Bütün LLM sağlayıcılar buna uymalı."""

    @abstractmethod
    async def chat(
        self,
        messages: list[LLMMessage],
        *,
        system: str | None = None,
        max_tokens: int = 4096,
    ) -> str:
        """Konuşma geçmişini gönderir, modelin metin yanıtını döner."""
        raise NotImplementedError


    @abstractmethod
    async def extract_program_details(self, body_text: str, source_name: str) -> ExtractedSupportInfo | None:
        """Raw metni alır, LLM'e gönderir ve yapılandırılmış veri döndürür."""
        raise NotImplementedError