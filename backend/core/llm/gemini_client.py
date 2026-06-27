"""Google Gemini adaptörü — sağlayıcı-bağımsız LLM katmanının bir uygulaması."""
from google import genai
from google.genai import types

from .base import LLMClient, LLMMessage

_ROLE_MAP = {"user": "user", "assistant": "model"}


class GeminiClient(LLMClient):
    def __init__(self, api_key: str, model: str) -> None:
        self._client = genai.Client(api_key=api_key)
        self._model = model

    async def chat(
        self,
        messages: list[LLMMessage],
        *,
        system: str | None = None,
        max_tokens: int = 4096,
    ) -> str:
        contents = [
            types.Content(
                role=_ROLE_MAP[m.role],
                parts=[types.Part.from_text(text=m.content)],
            )
            for m in messages
        ]
        config = types.GenerateContentConfig(
            system_instruction=system,
            max_output_tokens=max_tokens,
        )
        resp = await self._client.aio.models.generate_content(
            model=self._model,
            contents=contents,
            config=config,
        )
        return resp.text
