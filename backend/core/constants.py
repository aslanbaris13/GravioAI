"""Connector'lar arasında paylaşılan sabit veri listeleri.

Bunlar connectors/base.py'nin kalabalıklaşmaması için burada tutuluyor —
BaseConnector sadece metodları taşıyor, sabit veri
listeleri burada tutuluyor.
"""

# Ay kısaltmalarını sayıya çeviren sözlük 
# _normalize_deadline() içinde kullanılıyor.
AY_KISALTMALARI = {
    "oca": 1, "jan": 1, "sub": 2, "şub": 2, "feb": 2, "mar": 3,
    "nis": 4, "apr": 4, "may": 5, "haz": 6, "jun": 6, "tem": 7, "jul": 7,
    "agu": 8, "ağu": 8, "aug": 8, "eyl": 9, "sep": 9, "eki": 10, "oct": 10,
    "kas": 11, "nov": 11, "ara": 12, "dec": 12,
}

# None olan text/opsiyonel alanları doldurmak için kullanılan Türkçe mesajlar — 
# format_to_db() içinde kullanılıyor.
BOS_ALAN_MESAJLARI = {
    "support_rate": "Destek oranı belirtilmemiştir.",
    "application_status": "Başvuru durumu bilgisi bulunmuyor.",
    "official_url": "Resmi başvuru bağlantısı belirtilmemiştir.",
    "founded_after": "Kuruluş tarihi şartı belirtilmemiştir.",
    "women_entrepreneur": "Kadın girişimci şartı belirtilmemiştir.",
    "technopark": "Teknopark şartı belirtilmemiştir.",
    "student": "Öğrenci şartı belirtilmemiştir.",
    "company_required": "Şirket şartı belirtilmemiştir.",
    "amount_max": "Maksimum destek tutarı belirtilmemiştir.",
}

# Kalkınma Ajansı'nın API'sinden gelen agency_code'ları okunaklı tam isme çeviren sözlük 
#sadece kalkinma_ajansi.py kullanıyor.

KALKINMA_AJANSI_ISIMLERI = {
    "ahika": "Ahiler Kalkınma Ajansı",
    "ankaraka": "Ankara Kalkınma Ajansı",
    "baka": "Batı Akdeniz Kalkınma Ajansı",
    "bakka": "Batı Karadeniz Kalkınma Ajansı",
    "bebka": "Bursa Eskişehir Bilecik Kalkınma Ajansı",
    "cka": "Çukurova Kalkınma Ajansı",
    "daka": "Doğu Anadolu Kalkınma Ajansı",
    "dika": "Dicle Kalkınma Ajansı",
    "dogaka": "Doğu Akdeniz Kalkınma Ajansı",
    "doka": "Doğu Karadeniz Kalkınma Ajansı",
    "fka": "Fırat Kalkınma Ajansı",
    "geka": "Güney Ege Kalkınma Ajansı",
    "gmka": "Güney Marmara Kalkınma Ajansı",
    "ika": "İpekyolu Kalkınma Ajansı",
    "istka": "İstanbul Kalkınma Ajansı",
    "izka": "İzmir Kalkınma Ajansı",
    "karacadag": "Karacadağ Kalkınma Ajansı",
    "kudaka": "Kuzeydoğu Anadolu Kalkınma Ajansı",
    "marka": "Doğu Marmara Kalkınma Ajansı",
    "mevka": "Mevlana Kalkınma Ajansı",
    "oka": "Orta Karadeniz Kalkınma Ajansı",
    "oran": "Orta Anadolu Kalkınma Ajansı",
    "serka": "Serhat Kalkınma Ajansı",
    "trakyaka": "Trakya Kalkınma Ajansı",
    "zafer": "Zafer Kalkınma Ajansı",
}

# Türkçe büyük/küçük harfli özel karakterleri ASCII karşılıklarına çeviren sözlük
# generate_id() içinde slug üretirken kullanılıyor. Büyük harfler
# küçültülmeden ÖNCE uygulanmalı (özellikle "İ" için — Python'un normal
# .lower() metodu "İ"yi doğru çevirmiyor, görünmez bir karakter ekliyor).

TURKCE_KARAKTER_DEGISIMLERI = {
    "İ": "i", "I": "i", "ı": "i",
    "Ğ": "g", "ğ": "g",
    "Ü": "u", "ü": "u",
    "Ş": "s", "ş": "s",
    "Ö": "o", "ö": "o",
    "Ç": "c", "ç": "c",
}