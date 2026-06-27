"""Config'e göre doğru LLM sağlayıcı adaptörünü üretir.

Yeni sağlayıcı eklemek = buraya bir `elif` + yeni adaptör dosyası. Ajan kodu
değişmez.
"""
from functools import lru_cache

from ..config import Settings, get_settings
from .base import LLMClient


def build_llm_client(settings: Settings) -> LLMClient:
    provider = settings.llm_provider.lower()

    if provider == "anthropic":
        from .anthropic_client import AnthropicClient

        return AnthropicClient(api_key=settings.anthropic_api_key, model=settings.llm_model)

    if provider == "gemini":
        from .gemini_client import GeminiClient

        return GeminiClient(api_key=settings.gemini_api_key, model=settings.llm_model)

    # İleride: "openai" ...
    raise ValueError(f"Desteklenmeyen LLM sağlayıcı: {settings.llm_provider!r}")


@lru_cache
def get_llm_client() -> LLMClient:
    return build_llm_client(get_settings())
