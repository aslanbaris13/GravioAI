"""Oturum kalıcılığı modeli.

Kullanıcının en son çıkarılan profili + eşleşmelerini saklar, böylece sayfa
yenilenince veya farklı bir cihazdan dönülünce sohbetin ürettiği sonuç
kaybolmaz. `session_id`'yi frontend (localStorage'da) üretir; burada sadece
onun karşılığındaki veri tutulur.
"""
from pydantic import BaseModel, Field

from .orchestration import ProgramMatch
from .profile import UserProfile


class SessionState(BaseModel):
    """Bir oturumun kalıcı durumu — profil + son bilinen eşleşmeler."""

    profile: UserProfile = Field(default_factory=UserProfile)
    matches: list[ProgramMatch] = Field(default_factory=list)
