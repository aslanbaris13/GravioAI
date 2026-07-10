"""Config'e göre doğru embedding sağlayıcı adaptörünü üretir.

Yeni sağlayıcı eklemek = buraya bir `elif` + yeni adaptör dosyası. Çağıran kod
(ingest.py vb.) hangi sağlayıcı kullanıldığını hiç bilmek zorunda kalmaz.
"""
from functools import lru_cache

from core.config import Settings, get_settings
from .base import EmbeddingClient


def build_embedding_client(settings: Settings) -> EmbeddingClient:
    provider = settings.embedding_provider.lower()

    if provider == "gemini":
        from .gemini_embedding import GeminiEmbeddingClient
        return GeminiEmbeddingClient(
            api_key=settings.gemini_api_key,
            model=settings.embedding_model,
        )

    raise ValueError(f"Desteklenmeyen embedding sağlayıcı: {settings.embedding_provider!r}")


@lru_cache
def get_embedding_client() -> EmbeddingClient:
    return build_embedding_client(get_settings())