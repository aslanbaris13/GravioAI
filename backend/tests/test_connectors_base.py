"""connectors/base.py testleri.

Not: connectors/ ve altındaki dosyalar (Hatice'nin veri toplama pipeline'ı),
`cd backend && python -m scripts.scrape` gibi bağımsız çalıştırılmak üzere
MUTLAK import kullanır (`from models.program import ...`, `from core.cleaner
import ...`) — canlı FastAPI uygulamasının `backend.` paket-nitelikli
importlarından farklı bir kurulum. Bu yüzden bu test dosyasında `backend/`
dizinini sys.path'e ekleyip connectors/base.py'yi KENDİ beklediği şekilde
(paket öneki olmadan) import ediyoruz — üretim kodunda hiçbir değişiklik
gerektirmez, sadece test importunu connectors/base.py'nin gerçek çalışma
şekliyle uyumlu hale getirir.
"""
import sys
from pathlib import Path

import pytest

_BACKEND_DIR = str(Path(__file__).resolve().parent.parent)
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from connectors.base import BaseConnector, _normalize_deadline  # noqa: E402
from models.program import ExtractedSupportInfo  # noqa: E402


class _DummyConnector(BaseConnector):
    SOURCE_NAME = "KOSGEB"

    async def fetch(self) -> list[dict]:
        return []


@pytest.fixture
def connector():
    return _DummyConnector()


class TestNormalizeDeadline:
    def test_iso_format_untouched(self):
        assert _normalize_deadline("2026-07-17") == "2026-07-17"

    def test_none_and_empty_pass_through(self):
        assert _normalize_deadline(None) is None
        assert _normalize_deadline("") == ""

    def test_turkish_short_month_format(self):
        assert _normalize_deadline("15 Haz 2026") == "2026-06-15"

    def test_format_with_trailing_time(self):
        assert _normalize_deadline("16 May 2024 - 00:00") == "2024-05-16"

    def test_unrecognized_format_returned_as_is(self):
        assert _normalize_deadline("bilinmeyen bir tarih ifadesi") == "bilinmeyen bir tarih ifadesi"


class TestGenerateId:
    def test_turkish_characters_transliterated(self, connector):
        assert connector.generate_id("Öğrenci Girişimci Desteği") == "ogrenci-girisimci-destegi"

    def test_dotted_capital_i_handled_correctly(self, connector):
        # Python'un normal .lower()'ı "İ"yi yanlış çevirir (görünmez karakter ekler) —
        # connectors/base.py bunu TURKCE_KARAKTER_DEGISIMLERI ile elle çözüyor.
        result = connector.generate_id("İstanbul Kalkınma Ajansı")
        assert result == "istanbul-kalkinma-ajansi"
        assert "i̇" not in result  # görünmez nokta karakteri sızmamalı

    def test_punctuation_removed(self, connector):
        assert connector.generate_id("KOSGEB: Girişimci Desteği (2026)") == "kosgeb-girisimci-destegi-2026"


class TestFormatToDb:
    def test_fills_missing_text_fields_with_placeholder_messages(self, connector):
        info = ExtractedSupportInfo(title="Test Programı")
        row = connector.format_to_db(info, url="https://example.com", raw_text="ham metin", source_name="KOSGEB")
        assert row["deadline"] == "Son başvuru tarihi belirtilmemiş"
        assert row["support_rate"] == "Destek oranı belirtilmemiş"
        assert row["official_url"] == "Resmi link belirtilmemiş"

    def test_defaults_region_to_ulusal_when_missing(self, connector):
        info = ExtractedSupportInfo(title="Test Programı")
        row = connector.format_to_db(info, url="https://example.com", raw_text="x", source_name="KOSGEB")
        assert row["region"] == "Ulusal"

    def test_region_override_takes_precedence(self, connector):
        info = ExtractedSupportInfo(title="Test Programı", region="Farklı Bölge")
        row = connector.format_to_db(
            info, url="https://example.com", raw_text="x", source_name="KOSGEB", region_override="İstanbul",
        )
        assert row["region"] == "İstanbul"

    def test_source_name_overrides_llm_guess(self, connector):
        info = ExtractedSupportInfo(title="Test Programı", source="LLM'in tahmini")
        row = connector.format_to_db(info, url="https://example.com", raw_text="x", source_name="KOSGEB")
        assert row["source"] == "KOSGEB"

    def test_deadline_gets_normalized(self, connector):
        info = ExtractedSupportInfo(title="Test Programı", deadline="15 Haz 2026")
        row = connector.format_to_db(info, url="https://example.com", raw_text="x", source_name="KOSGEB")
        assert row["deadline"] == "2026-06-15"

    def test_program_id_generated_from_title(self, connector):
        info = ExtractedSupportInfo(title="Öğrenci Destek Programı")
        row = connector.format_to_db(info, url="https://example.com", raw_text="x", source_name="KOSGEB")
        assert row["program_id"] == "ogrenci-destek-programi"
