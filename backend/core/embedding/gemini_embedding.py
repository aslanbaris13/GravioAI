from google import genai
from .base import EmbeddingClient


class GeminiEmbeddingClient(EmbeddingClient):
    """Gemini embedding modelini kullanan somut uygulama."""

    def __init__(self, api_key: str, model: str) -> None:
        self._client = genai.Client(api_key=api_key)
        self._model = model

    async def embed_text(self, text: str) -> list[float]:
        """Metni Gemini embedding API'sine gönderir, dönen vektörü döner."""
        response = await self._client.aio.models.embed_content(
            model=self._model,
            contents=text,
            config={'output_dimensionality': 768},
        )
        return response.embeddings[0].values