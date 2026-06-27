"""Sağlayıcı-bağımsız LLM arayüzü.

Tüm ajanlar bu arayüz üzerinden konuşur; somut sağlayıcı (Anthropic, Gemini,
OpenAI...) `factory.get_llm_client` ile config'ten seçilir. Model/sağlayıcı
değişse bile ajan kodu değişmez.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Literal

Role = Literal["user", "assistant"]


@dataclass
class LLMMessage:
    role: Role
    content: str


class LLMClient(ABC):
    """Bütün LLM sağlayıcı adaptörlerinin uyduğu kontrat."""

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
