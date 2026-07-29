from data.report_schema_loader import (
    get_report_schema,
    load_report_schemas,
    resolve_report_schema_for_program,
)


def test_loads_all_report_schemas():
    keys = {s.key for s in load_report_schemas()}
    expected_keys = {
        "tubitak_1507",
        "tubitak_1501",
        "tubitak_1711",
        "tubitak_1831",
        "kosgeb_dijital_donusum",
        "kosgeb_yesil_sanayi",
        "kosgeb_stratejik_urun",
        "kalkinma_fizibilite",
        "ticaret_pazara_giris",
        "ticaret_e_ihracat",
        "ufuk_avrupa_eic",
    }
    assert expected_keys.issubset(keys)


def test_get_report_schema_by_key():
    # TÜBİTAK Kontrolü
    schema_tubitak = get_report_schema("tubitak_1507")
    assert schema_tubitak is not None
    assert schema_tubitak.institution == "TÜBİTAK"

    # Ticaret Bakanlığı Kontrolü
    schema_ticaret = get_report_schema("ticaret_pazara_giris")
    assert schema_ticaret is not None
    assert schema_ticaret.institution == "Ticaret Bakanlığı"

    # AB Kontrolü
    schema_ab = get_report_schema("ufuk_avrupa_eic")
    assert schema_ab is not None
    assert schema_ab.institution == "Avrupa Birliği (AB)"


def test_get_report_schema_returns_none_for_unknown_key():
    assert get_report_schema("bilinmeyen_program") is None


# --- TÜBİTAK Eşleşme (Resolve) Testleri ---

def test_resolve_matches_1507_by_keyword():
    schema = resolve_report_schema_for_program("TÜBİTAK 1507 - KOBİ Ar-Ge Başlangıç Destek Programı")
    assert schema is not None
    assert schema.key == "tubitak_1507"


def test_resolve_matches_1501_by_keyword():
    schema = resolve_report_schema_for_program("Sanayi Ar-Ge Destek Programı (1501)")
    assert schema is not None
    assert schema.key == "tubitak_1501"


def test_resolve_matches_1711_by_keyword():
    schema = resolve_report_schema_for_program("TÜBİTAK 1711 Yapay Zeka Ekosistem Çağrısı")
    assert schema is not None
    assert schema.key == "tubitak_1711"


def test_resolve_matches_1831_by_keyword():
    schema = resolve_report_schema_for_program("1831 - Yeşil İnovasyon Teknoloji Mentorluk Desteği")
    assert schema is not None
    assert schema.key == "tubitak_1831"


# --- KOSGEB Eşleşme (Resolve) Testleri ---

def test_resolve_matches_kosgeb_dijital_donusum_by_keyword():
    schema = resolve_report_schema_for_program("KOBİ Dijital Dönüşüm Destek Programı")
    assert schema is not None
    assert schema.key == "kosgeb_dijital_donusum"


def test_resolve_matches_kosgeb_yesil_sanayi_by_keyword():
    schema = resolve_report_schema_for_program("KOSGEB Yeşil Sanayi Destek Programı 2026")
    assert schema is not None
    assert schema.key == "kosgeb_yesil_sanayi"


def test_resolve_matches_kosgeb_stratejik_urun_by_keyword():
    schema = resolve_report_schema_for_program("Stratejik Ürün Destek Programı Başvuru")
    assert schema is not None
    assert schema.key == "kosgeb_stratejik_urun"


# --- Kalkınma Ajansı Eşleşme Testleri ---

def test_resolve_matches_kalkinma_fizibilite_by_keyword():
    schema = resolve_report_schema_for_program("Kalkınma Ajansı Fizibilite Desteği Programı 2026")
    assert schema is not None
    assert schema.key == "kalkinma_fizibilite"


# --- Ticaret Bakanlığı ve AB Eşleşme Testleri ---

def test_resolve_matches_ticaret_pazara_giris_by_keyword():
    schema = resolve_report_schema_for_program("Pazara Giriş Belgesi Desteği 2026")
    assert schema is not None
    assert schema.key == "ticaret_pazara_giris"


def test_resolve_matches_ticaret_e_ihracat_by_keyword():
    schema = resolve_report_schema_for_program("Ticaret Bakanlığı e-ihracat Destekleri Başvurusu")
    assert schema is not None
    assert schema.key == "ticaret_e_ihracat"


def test_resolve_matches_ufuk_avrupa_eic_by_keyword():
    schema = resolve_report_schema_for_program("Horizon Europe EIC Accelerator Call")
    assert schema is not None
    assert schema.key == "ufuk_avrupa_eic"


# --- Olumsuz Durum ve Şema İçerik Doğrulama Testleri ---

def test_resolve_returns_none_for_unrecognized_program():
    assert resolve_report_schema_for_program("Kadın Girişimci Destek Kredisi") is None


def test_each_section_has_at_least_one_required_field():
    for schema in load_report_schemas():
        for section in schema.sections:
            assert len(section.required_fields) > 0, f"{schema.key}/{section.id} boş alan listesine sahip"