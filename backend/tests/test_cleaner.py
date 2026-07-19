import pytest

from core.cleaner import (
    KalkinmaAjansiCleaner,
    KOSGEBCleaner,
    TubitakCleaner,
    get_cleaner,
)


@pytest.fixture
def cleaner():
    return KOSGEBCleaner()


def test_strips_noise_tags(cleaner):
    html = "<html><body><script>alert(1)</script><style>.x{}</style><p>Gerçek içerik</p></body></html>"
    result = cleaner.clean(html)
    assert "alert" not in result
    assert "Gerçek içerik" in result


def test_removes_high_link_density_blocks(cleaner):
    # Link yoğunluğu yüksek bir menü bloğu (neredeyse tamamen linklerden oluşuyor)
    nav_links = "".join(f'<a href="/{i}">Menü öğesi {i} uzun başlık</a>' for i in range(10))
    html = f"""
    <html><body>
        <div>{nav_links}</div>
        <p>Bu, programın gerçek açıklama metnidir ve link içermez, sadece düz metindir.</p>
    </body></html>
    """
    result = cleaner.clean(html)
    assert "Menü öğesi" not in result
    assert "gerçek açıklama metnidir" in result


def test_removes_known_widget_blocks_by_id_and_class(cleaner):
    html = """
    <html><body>
        <div id="accessibility-menu">Erişilebilirlik Ayarları</div>
        <nav class="breadcrumb">Ana Sayfa > Destekler</nav>
        <p>Asıl program açıklaması burada.</p>
    </body></html>
    """
    result = cleaner.clean(html)
    assert "Erişilebilirlik" not in result
    assert "Ana Sayfa" not in result
    assert "Asıl program açıklaması" in result


def test_collapses_excess_blank_lines(cleaner):
    html = "<p>Birinci satır</p>" + "<p></p>" * 5 + "<p>İkinci satır</p>"
    result = cleaner.clean(html)
    assert "\n\n\n" not in result


def test_get_cleaner_returns_correct_class_per_source():
    assert isinstance(get_cleaner("KOSGEB"), KOSGEBCleaner)
    assert isinstance(get_cleaner("TUBITAK"), TubitakCleaner)
    assert isinstance(get_cleaner("KALKINMA_AJANSI"), KalkinmaAjansiCleaner)


def test_get_cleaner_raises_for_unknown_source():
    with pytest.raises(ValueError):
        get_cleaner("BILINMEYEN_KURUM")
