"""
Embedding katmanı — metni sayısal vektöre çeviren sağlayıcı-bağımsız arayüz.
"""
from abc import ABC, abstractmethod
from functools import lru_cache

from google import genai

from core.config import Settings, get_settings


class EmbeddingClient(ABC):
    """Bütün embedder'ların (gemini, openai..) buna uyması gerek"""

    @abstractmethod
    async def embed_text(self, text: str) -> list[float]:
        """Verilen metni sayısal bir vektöre çevirir."""
        raise NotImplementedError


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


def build_embedding_client(settings: Settings) -> EmbeddingClient:
    """Config'e göre doğru embedding sağlayıcı adaptörünü üretir.

    Yeni sağlayıcı eklemek = buraya bir `elif` + yeni sınıf. Çağıran kod
    (ingest.py vb.) hangi sağlayıcı kullanıldığını hiç bilmek zorunda kalmaz.
    """
    provider = settings.embedding_provider.lower()

    if provider == "gemini":
        return GeminiEmbeddingClient(
            api_key=settings.gemini_api_key,
            model=settings.embedding_model,
        )

    raise ValueError(f"Desteklenmeyen embedding sağlayıcı: {settings.embedding_provider!r}")


@lru_cache
def get_embedding_client() -> EmbeddingClient:
    return build_embedding_client(get_settings())