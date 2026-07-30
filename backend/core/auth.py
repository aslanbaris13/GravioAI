"""Supabase Auth token doğrulama.

Kullanıcı kaydı/girişi backend'de değil, Supabase'in barındırdığı Auth
servisinde yapılıyor. Backend'in tek işi, istemcinin gönderdiği erişim
token'ının gerçekten o servisten geldiğini kanıtlamak ve içindeki kullanıcı
kimliğini güvenle çıkarmak.

Bu proje **asimetrik imzalama** kullanıyor (ES256): paylaşılan bir sır yok,
doğrulama Supabase'in JWKS ucundaki açık anahtarla yapılır. Eski projelerdeki
`SUPABASE_JWT_SECRET` (HS256) yaklaşımı burada geçerli değildir.

Anonim erişim korunur: Authorization başlığı hiç yoksa `None` döner ve çağıran
uç nokta anonim davranışını sürdürür. Başlık VARSA ama geçersizse 401 verilir —
bozuk token'ı sessizce anonim saymak hataları gizler.
"""
import logging
from functools import lru_cache

import jwt
from fastapi import HTTPException, Request

from core.config import get_settings

logger = logging.getLogger(__name__)

# Supabase erişim token'larında sabit olan alanlar.
_AUDIENCE = "authenticated"
# JWKS'te ES256 ilan ediliyor; RS256 de kabul ediliyor ki Supabase anahtar
# tipini değiştirirse doğrulama sessizce kırılmasın.
_ALGORITHMS = ["ES256", "RS256"]


def _base_url() -> str:
    return get_settings().supabase_url.rstrip("/")


@lru_cache
def _jwk_client() -> jwt.PyJWKClient:
    """JWKS istemcisi (tekil). Açık anahtarları önbelleğe alır, her istekte
    Supabase'e gitmez."""
    return jwt.PyJWKClient(f"{_base_url()}/auth/v1/.well-known/jwks.json", cache_keys=True)


def verify_access_token(token: str) -> str:
    """Token'ı doğrular ve kullanıcı kimliğini (`sub`) döner.

    Geçersizse `HTTPException(401)` fırlatır. İmza, süre (`exp`), hedef kitle
    (`aud`) ve düzenleyici (`iss`) alanlarının hepsi kontrol edilir — yalnızca
    imzayı doğrulamak yetmez, başka bir projenin token'ı da imzalı olabilir.
    """
    try:
        signing_key = _jwk_client().get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=_ALGORITHMS,
            audience=_AUDIENCE,
            issuer=f"{_base_url()}/auth/v1",
        )
    except Exception as exc:
        logger.info("token_dogrulanamadi: %s", type(exc).__name__)
        raise HTTPException(status_code=401, detail="Geçersiz veya süresi dolmuş oturum") from exc

    user_id = claims.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token kullanıcı kimliği içermiyor")
    return user_id


async def current_user_id(request: Request) -> str | None:
    """FastAPI dependency — girişliyse `user_id`, anonimse `None`.

    Kullanım:
        async def endpoint(user_id: str | None = Depends(current_user_id)):
    """
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    return verify_access_token(header[7:].strip())
