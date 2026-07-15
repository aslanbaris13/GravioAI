"""Uygulama ayarları — ortam değişkenlerinden okunur."""
from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILE, env_file_encoding="utf-8", extra="ignore"
    )

    app_env: str = "development"
    cors_origins: str = "http://localhost:3000"

    # LLM katmanı
    llm_provider: str = "gemini"
    llm_model: str = "gemini-3.5-flash"
    anthropic_api_key: str = ""
    gemini_api_key: str = ""

    # Embedding katmanı
    embedding_provider: str = "gemini"
    embedding_model: str = "gemini-embedding-001"

    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""
    # pgvector ile doğrudan SQL/vektör arama için Postgres bağlantı dizesi
    database_url: str = Field(default="", validation_alias="CONNECTION_URL")

    # Hız sınırlama — LLM çağrısı yapan uçlar için (bkz. core/rate_limit.py)
    # IP başına dakikada izin verilen istek sayısı (kötüye kullanıma karşı).
    rate_limit_per_minute: int = 10
    # Tüm sunucu için günlük toplam LLM isteği bütçesi (gerçek sağlayıcı
    # kotasını aşmadan önce anlaşılır bir hata vermek için — bkz. Sprint 2'de
    # yaşanan 429 RESOURCE_EXHAUSTED deneyimi). 0 = sınırsız.
    daily_llm_budget: int = 0

    @field_validator("supabase_url", mode="before")
    @classmethod
    def _normalize_supabase_url(cls, v):
        """Project URL'i taban hâline getirir; yanlışlıkla yapıştırılan
        '/rest/v1' soneki veya sondaki '/' temizlenir (supabase-py kendi ekler)."""
        if isinstance(v, str):
            v = v.strip().rstrip("/")
            if v.endswith("/rest/v1"):
                v = v[: -len("/rest/v1")]
        return v

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()