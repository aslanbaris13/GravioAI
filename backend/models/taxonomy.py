"""Destek evreninin taksonomisi — veri bilimi ekibinin tanımladığı 7 kategori.

`Category` değerleri doğrudan veri dosyalarındaki `kategori` alanıyla eşleşir.
`SUBCATEGORIES` her kategori altındaki kurum/program gruplarını listeler (UI
filtreleri ve veri doğrulaması için referans).
"""
from enum import Enum


class Category(str, Enum):
    KAMU = "Kamu Destekleri"
    VERGI_LOKASYON = "Vergi ve Lokasyon Teşvikleri"
    OZEL_SEKTOR = "Özel Sektör Bulut ve Yazılım Kredileri"
    HIZLANDIRICI = "Hızlandırıcı ve Kuluçka Merkezleri"
    YATIRIM = "Yatırım Kaynakları"
    YARISMA = "Yarışmalar ve Etkinlikler"
    GLOBAL = "Global Programlar"


# Her kategori altındaki kurum / program grubu (alt_kategori için referans)
SUBCATEGORIES: dict[Category, list[str]] = {
    Category.KAMU: [
        "KOSGEB", "TÜBİTAK", "Sanayi ve Teknoloji Bakanlığı", "Kalkınma Ajansları",
        "KGF", "Türkiye Kalkınma ve Yatırım Bankası", "İŞKUR",
        "Ticaret Bakanlığı", "TÜRKPATENT", "Avrupa Birliği Fonları",
    ],
    Category.VERGI_LOKASYON: [
        "Teknopark", "Ar-Ge Merkezi", "Tasarım Merkezi",
        "Genç Girişimci İstisnası", "SGK Prim Desteği", "Serbest Bölge",
    ],
    Category.OZEL_SEKTOR: [
        "AWS", "Google", "Microsoft", "NVIDIA", "OpenAI", "Anthropic",
        "Stripe", "GitHub", "HubSpot", "Twilio", "MongoDB", "Pinecone", "Supabase",
    ],
    Category.HIZLANDIRICI: [
        "İTÜ Çekirdek", "Cube Incubation", "KWORKS", "Workup", "PİLOT", "BTM",
        "Bilişim Vadisi", "Plug and Play", "Endeavor Türkiye", "StartersHub",
        "Growth Circuit", "Inovent",
    ],
    Category.YATIRIM: [
        "Melek Yatırım Ağları", "VC", "Kitlesel Fonlama",
    ],
    Category.YARISMA: [
        "TEKNOFEST", "Big Bang Startup Challenge", "Startup Istanbul",
        "Webrazzi Summit", "Hello Tomorrow", "Hackathon", "AImpact", "YZA",
        "Girişimcilik Vakfı",
    ],
    Category.GLOBAL: [
        "Y Combinator", "Techstars", "Antler", "Entrepreneur First", "EWOR",
        "Google Global Accelerator", "Microsoft Global Founders Hub",
    ],
}
