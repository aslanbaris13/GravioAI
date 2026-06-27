"""Anthropic (Claude) adaptörü — sağlayıcı-bağımsız LLM katmanının bir uygulaması."""
from anthropic import AsyncAnthropic

from .base import LLMClient, LLMMessage


class AnthropicClient(LLMClient):
    def __init__(self, api_key: str, model: str) -> None:
        self._client = AsyncAnthropic(api_key=api_key)
        self._model = model

    async def chat(
        self,
        messages: list[LLMMessage],
        *,
        system: str | None = None,
        max_tokens: int = 4096,
    ) -> str:
        kwargs: dict = {
            "model": self._model,
            "max_tokens": max_tokens,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
        }
        if system:
            kwargs["system"] = system

        resp = await self._client.messages.create(**kwargs)
        return "".join(block.text for block in resp.content if block.type == "text")
