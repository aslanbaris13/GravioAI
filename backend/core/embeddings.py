"""Metni vektör temsiline çeviren embedding katmanı (Gemini).

RAG eşleştirmesi için hem ingestion (programları indeksleme) hem de sorgu
(kullanıcı profilini aratma) tarafında kullanılır. Boyut, pgvector tablosundaki
`vector(768)` ile aynı olmalı.
"""
from functools import lru_cache

from google import genai
from google.genai import types

from .config import get_settings

_EMBED_MODEL = "gemini-embedding-001"
EMBED_DIM = 768


@lru_cache
def _client() -> genai.Client:
    return genai.Client(api_key=get_settings().gemini_api_key)


def embed_text(text: str) -> list[float]:
    """Tek bir metni embedding vektörüne çevirir."""
    resp = _client().models.embed_content(
        model=_EMBED_MODEL,
        contents=text,
        config=types.EmbedContentConfig(output_dimensionality=EMBED_DIM),
    )
    return list(resp.embeddings[0].values)
