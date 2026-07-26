"""Uygunluk değerlendirmesi modelleri.

Çıktı, frontend'in beklediği `elig` + `conditions` yapısıyla hizalıdır:
* EligibilityState  -> frontend `Elig.state`  ("full" | "partial" | "locked")
* ConditionState    -> frontend `Condition.state` ("met" | "action" | "unmet")
Böylece Uygunluk Ajanı'nın çıktısı arayüze neredeyse birebir geçer.
"""
from enum import Enum

from pydantic import BaseModel, Field, field_validator


class ConditionState(str, Enum):
    MET = "met"        # karşılandı
    ACTION = "action"  # küçük bir aksiyonla karşılanır (örn. belge hazırla)
    UNMET = "unmet"    # şu an karşılanmıyor (gerçek eksik)


class EligibilityState(str, Enum):
    FULL = "full"        # tüm koşullar karşılanıyor
    PARTIAL = "partial"  # ufak eksik/aksiyon var ama ulaşılabilir
    LOCKED = "locked"    # sert bir koşul karşılanmıyor


class EligibilityCondition(BaseModel):
    state: ConditionState = Field(description="Koşulun durumu")
    text: str = Field(description="Programın koşulu, kısa ve net")
    value: str = Field(description="Kullanıcının profiline göre durumu, örn. 'Düzce — bölge içinde'")
    hint: str | None = Field(
        default=None,
        description="action/unmet ise kullanıcının ne yapması gerektiğine dair kısa öneri",
    )


class EligibilityResult(BaseModel):
    state: EligibilityState = Field(description="Genel uygunluk durumu")
    score: int = Field(description="0-100 arası uygunluk skoru", ge=0, le=100)
    label: str = Field(description="Kısa etiket, örn. 'Tam uygun' / '1 koşul eksik'")
    conditions: list[EligibilityCondition] = Field(
        default_factory=list, description="Koşulların tek tek değerlendirmesi"
    )
    summary: str | None = Field(
        default=None, description="Değerlendirmenin bir cümlelik özeti"
    )

    # LLM'in serbest JSON çıktısında iki `state` alanı da aynı isimde ama
    # farklı enum'larda olduğu için (bu alan vs. `EligibilityCondition.state`)
    # model bazen bunları karıştırıp buraya bir ConditionState değeri
    # (met/action/unmet) yazıyor — bu, tur boyunca ham bir Pydantic hatasıyla
    # kullanıcıya yansıyıp tüm sohbet turunu çökertiyordu. `UserProfile`'daki
    # gibi (bkz. backend/models/profile.py) sessizce en yakın anlama eşleyip
    # kabul ediyoruz; gerçekten tanınmayan bir değerse normal doğrulama hatası
    # yine de fırlatılır.
    @field_validator("state", mode="before")
    @classmethod
    def _coerce_condition_state(cls, v):
        if isinstance(v, str):
            remap = {"met": "full", "action": "partial", "unmet": "locked"}
            return remap.get(v, v)
        return v
