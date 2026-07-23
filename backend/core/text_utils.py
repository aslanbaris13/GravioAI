"""Türkçe'ye özgü metin işleme yardımcıları.

Python'un yerleşik str.lower()/str.upper() metodları locale-bağımsızdır ve
Türkçe'nin İ/I kurallarını doğru uygulamaz:

Bu modül, harici bir kütüphaneye (PyICU, unicode_tr) ihtiyaç duymadan bu
sorunu çözen iki fonksiyon sağlar:

  - turkce_lower:   Türkçe karakterleri KORUYARAK güvenli küçültme
                     (arama/filtre/karşılaştırma için, ör. is_relevant)
  - turkce_slugify: Türkçe karakterleri ASCII'ye çevirip URL-güvenli
                     bir slug üretir (ör. generate_id, program_id üretimi)
"""
from core.constants import TURKCE_KARAKTER_DEGISIMLERI

# Sadece İ/I'nın yanlış küçülmesini düzeltmek için kullanılan eşleme.
# Not: core/constants.py'daki TURKCE_KARAKTER_DEGISIMLERI'nden farklı —
# o sözlük TÜM Türkçe karakterleri ASCII'ye çeviriyor (slug üretimi için).
# Burada ise Türkçe karakterleri korumak istiyoruz, sadece İ/I'nın doğru
# küçük harfe dönüşmesini sağlıyoruz.
_TURKCE_BUYUK_HARF_DUZELTMELERI = {
    "İ": "i",  # noktalı büyük İ -> noktalı küçük i
    "I": "ı",  # noktasız büyük I -> noktasız küçük ı
}


def turkce_lower(text: str) -> str:
    """Türkçe metni, İ/I tuzağına düşmeden küçük harfe çevirir.

    Türkçe karakterleri (ş, ğ, ü, ö, ç, ı) OLDUĞU GİBİ korur, sadece büyük
    İ/I harflerinin doğru küçük harfe dönüşmesini sağlar. Arama/filtre/
    karşılaştırma amaçlı kullanım için (ör. is_relevant, başlık eşleştirme).

    Örnek kullanım: bir kelime listesiyle (ör. EXCLUSION_KEYWORDS) karşılaştırma
    yapmadan önce, hem aranan metni hem de listedeki kelimeleri bu fonksiyonla
    küçültmek, büyük İ/I içeren kelimelerin sessizce kaçırılmasını önler.
    """
    for buyuk, kucuk in _TURKCE_BUYUK_HARF_DUZELTMELERI.items():
        text = text.replace(buyuk, kucuk)
    return text.lower()


def turkce_slugify(text: str) -> str:
    """Türkçe metni URL/ID-güvenli bir slug'a çevirir (ör. "kobi-ar-ge-programi").

    Türkçe karakterleri ASCII karşılıklarına çevirir (İ/ı/Ğ/Ü/Ş/Ö/Ç -> i/g/u/s/o/c),
    küçük harfe çevirir, alfanumerik olmayan karakterleri temizler ve kelimeleri
    "-" ile birleştirir. generate_id() (program_id üretimi) için kullanılır.
    """
    for eski, yeni in TURKCE_KARAKTER_DEGISIMLERI.items():
        text = text.replace(eski, yeni)

    text = text.lower()

    temiz_metin = "".join(harf for harf in text if harf.isalnum() or harf == " ")
    kelimeler = temiz_metin.split()
    return "-".join(kelimeler)