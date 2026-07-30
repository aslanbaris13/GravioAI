"""core/auth.py testleri.

Supabase'e hiç bağlanmadan çalışır: kendi ES256 anahtar çiftimizi üretip
token'ları onunla imzalıyor, JWKS istemcisini de o anahtarı döndürecek şekilde
değiştiriyoruz. Böylece doğrulama mantığını (imza, süre, aud, iss) ağ ve
gerçek anahtar olmadan sınayabiliyoruz.
"""
import time
from types import SimpleNamespace

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi import HTTPException

from core import auth

ISSUER = "https://proje.supabase.co/auth/v1"


@pytest.fixture
def keypair():
    private = ec.generate_private_key(ec.SECP256R1())
    return private, private.public_key()


@pytest.fixture(autouse=True)
def _patch_jwks(monkeypatch, keypair):
    """JWKS ağ çağrısını, testteki açık anahtarı döndüren sahte istemciyle değiştirir."""
    _, public = keypair
    monkeypatch.setattr(auth, "_base_url", lambda: "https://proje.supabase.co")
    monkeypatch.setattr(
        auth,
        "_jwk_client",
        lambda: SimpleNamespace(get_signing_key_from_jwt=lambda _t: SimpleNamespace(key=public)),
    )


def make_token(private, **overrides) -> str:
    payload = {
        "sub": "kullanici-123",
        "aud": "authenticated",
        "iss": ISSUER,
        "exp": int(time.time()) + 3600,
        **overrides,
    }
    return jwt.encode(payload, private, algorithm="ES256")


def test_gecerli_token_user_id_doner(keypair):
    private, _ = keypair
    assert auth.verify_access_token(make_token(private)) == "kullanici-123"


def test_suresi_dolmus_token_reddedilir(keypair):
    private, _ = keypair
    token = make_token(private, exp=int(time.time()) - 10)
    with pytest.raises(HTTPException) as e:
        auth.verify_access_token(token)
    assert e.value.status_code == 401


def test_baska_projenin_tokeni_reddedilir(keypair):
    """İmza geçerli olsa bile farklı bir issuer kabul edilmemeli."""
    private, _ = keypair
    token = make_token(private, iss="https://baska-proje.supabase.co/auth/v1")
    with pytest.raises(HTTPException):
        auth.verify_access_token(token)


def test_yanlis_audience_reddedilir(keypair):
    private, _ = keypair
    with pytest.raises(HTTPException):
        auth.verify_access_token(make_token(private, aud="baska-kitle"))


def test_baska_anahtarla_imzalanan_token_reddedilir():
    """Sahte anahtarla üretilmiş token, JWKS'teki açık anahtarla doğrulanamaz."""
    sahte = ec.generate_private_key(ec.SECP256R1())
    with pytest.raises(HTTPException):
        auth.verify_access_token(make_token(sahte))


def test_sub_yoksa_reddedilir(keypair):
    private, _ = keypair
    payload_token = jwt.encode(
        {"aud": "authenticated", "iss": ISSUER, "exp": int(time.time()) + 3600},
        private,
        algorithm="ES256",
    )
    with pytest.raises(HTTPException):
        auth.verify_access_token(payload_token)


# ---- dependency davranışı ----


class _Req:
    def __init__(self, headers):
        self.headers = headers


@pytest.mark.asyncio
async def test_baslik_yoksa_anonim(keypair):
    """Authorization başlığı hiç yoksa anonim akış sürer — 401 değil, None."""
    assert await auth.current_user_id(_Req({})) is None


@pytest.mark.asyncio
async def test_bearer_olmayan_baslik_anonim():
    assert await auth.current_user_id(_Req({"Authorization": "Basic abc"})) is None


@pytest.mark.asyncio
async def test_bozuk_token_401(keypair):
    """Başlık VARSA ama token geçersizse sessizce anonime düşülmez."""
    with pytest.raises(HTTPException) as e:
        await auth.current_user_id(_Req({"Authorization": "Bearer bozuk.token.dizesi"}))
    assert e.value.status_code == 401


@pytest.mark.asyncio
async def test_gecerli_token_dependency(keypair):
    private, _ = keypair
    req = _Req({"Authorization": f"Bearer {make_token(private)}"})
    assert await auth.current_user_id(req) == "kullanici-123"
