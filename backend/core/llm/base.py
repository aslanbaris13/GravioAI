"""Sağlayıcı-bağımsız LLM arayüzü.

Tüm ajanlar bu arayüz üzerinden konuşur; somut sağlayıcı (Anthropic, Gemini,
OpenAI...) `factory.get_llm_client` ile config'ten seçilir. Model/sağlayıcı
değişse bile ajan kodu değişmez.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import AsyncIterator, Literal, Optional
from ...models.program import ExtractedSupportInfo

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


    async def chat_stream(
        self,
        messages: list[LLMMessage],
        *,
        system: str | None = None,
        max_tokens: int = 4096,
    ) -> AsyncIterator[str]:
        """Konuşma geçmişini gönderir, modelin yanıtını parça parça (chunk) yield eder.

        Zorunlu değil — `extract_program_details` ile aynı sebep: henüz her
        sağlayıcı streaming desteklemiyor. Yalnızca gerçekten çağrılıp
        iterate edildiğinde hata verir (fonksiyon gövdesindeki `yield`
        onu bir async generator yapar, bu yüzden çağrı anında değil, ilk
        `__anext__()`'te fırlatılır).
        """
        raise NotImplementedError(f"{type(self).__name__} chat_stream'i desteklemiyor")
        yield  # pragma: no cover — erişilemez, fonksiyonu async generator yapmak için

    async def extract_program_details(self, body_text: str, source_name: str) -> ExtractedSupportInfo | None:
        """Raw metni alır, LLM'e gönderir ve yapılandırılmış veri döndürür.

        Zorunlu değil — henüz her sağlayıcı (ör. Anthropic) veri toplama
        pipeline'ını desteklemiyor. Yalnızca gerçekten çağrıldığında hata verir,
        böylece bu yeteneği implemente etmeyen sağlayıcılar/mock'lar da
        `LLMClient`'ı örnekleyebilir.
        """
        raise NotImplementedError(
            f"{type(self).__name__} extract_program_details'i desteklemiyor"
        )