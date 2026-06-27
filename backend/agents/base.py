"""Ajan iskeleti — tüm GravioAI ajanlarının ortak temeli.

Her ajan, sağlayıcı-bağımsız LLM katmanını (`LLMClient`) kullanır ve iki
yetenekten birini çağırır:

* `_complete(...)`  — serbest metin yanıt (örn. açıklama, sohbet)
* `_extract(..., Model)` — yapılandırılmış JSON yanıt -> Pydantic modeli

`_extract`, modelin JSON şemasını system prompt'a enjekte eder ve modelden
yalnızca o şemaya uyan JSON ister; dönen metni temizleyip doğrular. Bu yaklaşım
sağlayıcıdan bağımsızdır (Gemini/Anthropic/diğer fark etmez), çünkü özel
"structured output" API'sine değil, düz `chat()` arayüzüne dayanır.

Yeni ajan = `Agent`'tan türet, `name` + `system_prompt` ver, bir `run()` yaz.
"""
import asyncio
import json
import re
from abc import ABC
from typing import TypeVar

from pydantic import BaseModel

from ..core.llm import LLMClient, LLMMessage, get_llm_client

TModel = TypeVar("TModel", bound=BaseModel)

# Geçici (transient) sağlayıcı hatalarının işaretleri — bunlarda yeniden denenir.
_TRANSIENT = ("503", "unavailable", "429", "overloaded", "rate limit", "timeout")

_JSON_FENCE = re.compile(r"```(?:json)?\s*(.*?)\s*```", re.DOTALL)


def _loads_json(raw: str) -> dict:
    """LLM çıktısından JSON nesnesini ayıklar.

    Markdown kod bloğu (```json ... ```) veya cevabın başında/sonunda metin
    olsa bile ilk geçerli JSON nesnesini bulup ayrıştırır.
    """
    text = raw.strip()

    fence = _JSON_FENCE.search(text)
    if fence:
        text = fence.group(1).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # İlk '{' ile son '}' arasını dene (etrafta düz metin varsa)
        start, end = text.find("{"), text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(text[start : end + 1])
        raise


class Agent(ABC):
    """Tüm ajanların temel sınıfı.

    Alt sınıflar `name` ve `system_prompt` tanımlar, kendi `run()` imzasını
    yazar ve gövdede `self._extract(...)` / `self._complete(...)` çağırır.
    """

    name: str = "agent"
    system_prompt: str = ""

    def __init__(self, llm: LLMClient | None = None) -> None:
        self._llm = llm or get_llm_client()

    async def _chat(
        self,
        user_text: str,
        *,
        system: str | None,
        max_tokens: int,
        retries: int = 3,
    ) -> str:
        """LLM çağrısı; geçici hatalarda (503/429/overload) artan beklemeyle yeniden dener."""
        for attempt in range(retries):
            try:
                return await self._llm.chat(
                    [LLMMessage(role="user", content=user_text)],
                    system=system,
                    max_tokens=max_tokens,
                )
            except Exception as e:  # noqa: BLE001 — sağlayıcıya özgü hata tipleri değişebilir
                transient = any(t in str(e).lower() for t in _TRANSIENT)
                if not transient or attempt == retries - 1:
                    raise
                await asyncio.sleep(2 * (attempt + 1))
        raise RuntimeError("ulaşılamaz")  # döngü ya döner ya yükseltir

    async def _complete(
        self,
        user_text: str,
        *,
        system: str | None = None,
        max_tokens: int = 2048,
    ) -> str:
        """Serbest metin yanıt üretir."""
        return await self._chat(
            user_text, system=system or self.system_prompt, max_tokens=max_tokens
        )

    async def _extract(
        self,
        user_text: str,
        model: type[TModel],
        *,
        max_tokens: int = 2048,
    ) -> TModel:
        """Yapılandırılmış JSON yanıt üretir ve `model`'e doğrular."""
        schema = json.dumps(model.model_json_schema(), ensure_ascii=False)
        system = (
            f"{self.system_prompt}\n\n"
            "Yanıtını YALNIZCA aşağıdaki JSON şemasına uyan geçerli bir JSON "
            "nesnesi olarak ver. Açıklama, markdown veya kod bloğu ekleme. "
            "Bilinmeyen/çıkarılamayan alanlar için null kullan.\n"
            f"JSON şeması:\n{schema}"
        )
        raw = await self._chat(user_text, system=system, max_tokens=max_tokens)
        return model.model_validate(_loads_json(raw))
