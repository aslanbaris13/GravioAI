"""Sohbet geçmişi — `chat_threads` (adlandırılmış, sürdürülebilir konuşmalar)
ve `chat_messages` (her thread'in mesaj kayıtları) tablolarına karşılık gelir.

Mesaj içeriği bilinçli olarak serbest bir `data` alanında tutulur: zengin mesaj
şekli (metin/profil çipleri/program kartları/vb.) tamamen frontend'in
`ChatMessage` birleşik tipine ait — backend burada yalnızca opak bir JSON
kaydedip aynen geri veren bir arşiv görevi görür.
"""
from datetime import datetime

from pydantic import BaseModel, Field


class ChatThreadSummary(BaseModel):
    """Kenar çubuğundaki sohbet listesi için — mesajları içermez."""

    id: str
    title: str | None = None
    created_at: datetime
    updated_at: datetime


class ChatThreadMessage(BaseModel):
    """Bir thread'e ait tek bir mesaj kaydı."""

    role: str
    data: dict = Field(default_factory=dict)
    created_at: datetime | None = None


class ChatThreadMessageCreate(BaseModel):
    """`POST /threads/{id}/messages` gövdesi — bir turda birden fazla mesaj
    (ör. profil çipi + kartlar + metin) tek istekte eklenebilir."""

    role: str
    data: dict = Field(default_factory=dict)
