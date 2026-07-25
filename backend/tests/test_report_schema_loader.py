from data.report_schema_loader import (
    get_report_schema,
    load_report_schemas,
    resolve_report_schema_for_program,
)


def test_loads_both_bootcamp_schemas():
    keys = {s.key for s in load_report_schemas()}
    assert keys == {"tubitak_1507", "tubitak_1501"}


def test_get_report_schema_by_key():
    schema = get_report_schema("tubitak_1507")
    assert schema is not None
    assert schema.institution == "TÜBİTAK"
    assert len(schema.sections) > 0


def test_get_report_schema_returns_none_for_unknown_key():
    assert get_report_schema("bilinmeyen_program") is None


def test_resolve_matches_1507_by_keyword():
    schema = resolve_report_schema_for_program("TÜBİTAK 1507 - KOBİ Ar-Ge Başlangıç Destek Programı")
    assert schema is not None
    assert schema.key == "tubitak_1507"


def test_resolve_matches_1501_by_keyword():
    schema = resolve_report_schema_for_program("Sanayi Ar-Ge Destek Programı (1501)")
    assert schema is not None
    assert schema.key == "tubitak_1501"


def test_resolve_returns_none_for_unrecognized_program():
    assert resolve_report_schema_for_program("Kadın Girişimci Destek Kredisi") is None


def test_each_section_has_at_least_one_required_field():
    for schema in load_report_schemas():
        for section in schema.sections:
            assert len(section.required_fields) > 0, f"{schema.key}/{section.id} boş alan listesine sahip"
