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
        "tubitak_1001",
        "tubitak_1505",
        "tubitak_1512",
        "kosgeb_dijital_donusum",
        "kosgeb_yesil_sanayi",
        "kosgeb_stratejik_urun",
        "kosgeb_arge_inovasyon",
        "kosgeb_girisimcilik",
        "kosgeb_kobi_gelisim",
        "kosgeb_isletme_gelistirme",
        "kosgeb_yalin_donusum",
        "kosgeb_yapay_zeka_kredi",
        "kalkinma_fizibilite",
        "ticaret_pazara_giris",
        "ticaret_e_ihracat",
        "ticaret_turquality",
        "ufuk_avrupa_eic",
        "sanayi_hamle",
        "hazine_kobi_finansman",
        "ipard_tarim",
    }
    assert expected_keys.issubset(keys)


def test_get_report_schema_by_key():
    schema_yalin = get_report_schema("kosgeb_yalin_donusum")
    assert schema_yalin is not None
    assert schema_yalin.institution == "KOSGEB"

    schema_yz = get_report_schema("kosgeb_yapay_zeka_kredi")
    assert schema_yz is not None
    assert schema_yz.institution == "KOSGEB"

    schema_turquality = get_report_schema("ticaret_turquality")
    assert schema_turquality is not None
    assert schema_turquality.institution == "Ticaret Bakanlığı"

    schema_ipard = get_report_schema("ipard_tarim")
    assert schema_ipard is not None
    assert schema_ipard.institution == "TKDK (Tarım ve Kırsal Kalkınmayı Destekleme Kurumu)"


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


def test_resolve_matches_1001_by_keyword():
    schema = resolve_report_schema_for_program("1001 Bilimsel Araştırma Projeleri Çağrısı")
    assert schema is not None
    assert schema.key == "tubitak_1001"


def test_resolve_matches_1505_by_keyword():
    schema = resolve_report_schema_for_program("TÜBİTAK 1505 Üniversite Sanayi İşbirliği Programı")
    assert schema is not None
    assert schema.key == "tubitak_1505"


def test_resolve_matches_1512_by_keyword():
    schema = resolve_report_schema_for_program("TÜBİTAK 1512 BİGG Bireysel Genç Girişim")
    assert schema is not None
    assert schema.key == "tubitak_1512"


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


def test_resolve_matches_kosgeb_arge_inovasyon_by_keyword():
    schema = resolve_report_schema_for_program("KOSGEB Ar-Ge ve İnovasyon Destek Programı")
    assert schema is not None
    assert schema.key == "kosgeb_arge_inovasyon"


def test_resolve_matches_kosgeb_girisimcilik_by_keyword():
    schema = resolve_report_schema_for_program("Girişimcilik Destek Programı İş Kurma Başvurusu")
    assert schema is not None
    assert schema.key == "kosgeb_girisimcilik"


def test_resolve_matches_kosgeb_kobi_gelisim_by_keyword():
    schema = resolve_report_schema_for_program("kobigel - kobi gelişim destek programı 2026")
    assert schema is not None
    assert schema.key == "kosgeb_kobi_gelisim"


def test_resolve_matches_kosgeb_isletme_gelistirme_by_keyword():
    schema = resolve_report_schema_for_program("kosgeb işletme geliştirme destek programı başvurusu")
    assert schema is not None
    assert schema.key == "kosgeb_isletme_gelistirme"


def test_resolve_matches_kosgeb_yalin_donusum_by_keyword():
    schema = resolve_report_schema_for_program("KOSGEB Yalın Dönüşüm Model Fabrika Desteği")
    assert schema is not None
    assert schema.key == "kosgeb_yalin_donusum"


def test_resolve_matches_kosgeb_yapay_zeka_kredi_by_keyword():
    schema = resolve_report_schema_for_program("KOSGEB Yapay Zeka Kredi Destek Programı 2026")
    assert schema is not None
    assert schema.key == "kosgeb_yapay_zeka_kredi"


# --- Kalkınma, Ticaret, AB, Sanayi, Hazine ve IPARD Eşleşme Testleri ---

def test_resolve_matches_kalkinma_fizibilite_by_keyword():
    schema = resolve_report_schema_for_program("Kalkınma Ajansı Fizibilite Desteği Programı 2026")
    assert schema is not None
    assert schema.key == "kalkinma_fizibilite"


def test_resolve_matches_ticaret_pazara_giris_by_keyword():
    schema = resolve_report_schema_for_program("Pazara Giriş Belgesi Desteği 2026")
    assert schema is not None
    assert schema.key == "ticaret_pazara_giris"


def test_resolve_matches_ticaret_e_ihracat_by_keyword():
    schema = resolve_report_schema_for_program("Ticaret Bakanlığı e-ihracat Destekleri Başvurusu")
    assert schema is not None
    assert schema.key == "ticaret_e_ihracat"


def test_resolve_matches_ticaret_turquality_by_keyword():
    schema = resolve_report_schema_for_program("Ticaret Bakanlığı Turquality Destek Programı")
    assert schema is not None
    assert schema.key == "ticaret_turquality"


def test_resolve_matches_ufuk_avrupa_eic_by_keyword():
    schema = resolve_report_schema_for_program("Horizon Europe EIC Accelerator Call")
    assert schema is not None
    assert schema.key == "ufuk_avrupa_eic"


def test_resolve_matches_sanayi_hamle_by_keyword():
    schema = resolve_report_schema_for_program("Teknoloji Odaklı Sanayi Hamlesi Programı 2026")
    assert schema is not None
    assert schema.key == "sanayi_hamle"


def test_resolve_matches_hazine_kobi_finansman_by_keyword():
    schema = resolve_report_schema_for_program("Hazine Destekli KGF KOBİ Finansman Paketi")
    assert schema is not None
    assert schema.key == "hazine_kobi_finansman"


def test_resolve_matches_ipard_tarim_by_keyword():
    schema = resolve_report_schema_for_program("TKDK IPARD Kırsal Kalkınma Desteği 2026")
    assert schema is not None
    assert schema.key == "ipard_tarim"


# --- Olumsuz Durum ve Şema İçerik Doğrulama Testleri ---

def test_resolve_returns_none_for_unrecognized_program():
    assert resolve_report_schema_for_program("Kadın Girişimci Destek Kredisi") is None


def test_each_section_has_at_least_one_required_field():
    for schema in load_report_schemas():
        for section in schema.sections:
            assert len(section.required_fields) > 0, f"{schema.key}/{section.id} boş alan listesine sahip"