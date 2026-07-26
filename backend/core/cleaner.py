from abc import ABC, abstractmethod
from bs4 import BeautifulSoup
import re  # Metindeki fazladan boşlukları silmek için

class BaseCleaner(ABC):
    """
    Tüm kurum-özel cleaner sınıflarının temel sınıfı (Template Method deseni).

    Genel akış (clean metodu) sabittir ve alt sınıflarda override edilmez:
    1. HTML etiketlerini temizle 
    2. Link yoğunluğu yüksek blokları sil  
    3. Sayfalar arası tekrar eden satırları sil   
    
    4. Kuruma özel ince ayar - sadece alt sınıflar override eder
    """

    # HTML seviyesinde her zaman silinecek etiketler (site fark etmeksizin gürültü)
    TAGS_TO_REMOVE = ["style", "script", "noscript", "header", "footer", "nav", "aside", "form", "svg"]

    # Link yoğunluğu bu eşiği aşan bloklar menü/navigasyon sayılıp silinir
    LINK_DENSITY_THRESHOLD = 0.6

    # Bir bloğun link-density hesaplamasına girebilmesi için minimum karakter sayısı
    # (çok kısa metinlerde oran güvenilmez olur, örn. tek kelimelik bir link tag'ı)
    MIN_BLOCK_LENGTH_FOR_DENSITY_CHECK = 20
    
    KNOWN_WIDGET_ID_PATTERNS = [
        "reading-guide",
        "reading-mask",
        "accessibility",
    ]

    KNOWN_WIDGET_CLASS_PATTERNS = [
        "breadcrumb",
    ]

    # Tüm kurumlarda (KOSGEB, TÜBİTAK, Kalkınma Ajansı, ileride eklenecekler)
    # ortak görülen, tipik "web sitesi iskeleti" gürültü satırları — erişilebilirlik
    # linkleri, zoom/büyüteç widget kontrolleri gibi. Kuruma özel olmayan, herhangi
    # bir modern devlet/kurum sitesinde rastlanabilecek ifadeler burada durur.
    # Kuruma özel gürültüler için her alt sınıf kendi forbidden_terms'ini tanımlar.
    COMMON_FORBIDDEN_TERMS = [
        "Ana içeriğe atla",
        "Görsel",
        "+",
        "-",
        "0",
    ]

    # Kuruma özel, sayfalar arası tekrar eden gürültü satırları (ör. KOSGEB'in
    # erişilebilirlik menüsü ifadeleri). Her alt sınıf kendi listesini tanımlar;
    # varsayılan boş liste, henüz bilinen bir gürültü kalıbı olmayan kurumlar
    # için. clean() bu listeyi COMMON_FORBIDDEN_TERMS ile birleştirip TAM EŞLEŞME
    # mantığıyla kullanır: bir satır, listedeki bir ifadeye BİREBİR eşitse
    # silinir (satır içinde geçiyor olması yetmez) — kısa terimlerin (ör. "x")
    # alakasız satırları yanlışlıkla silmesini önlemek için.
    forbidden_terms: list[str] = []

    def clean(self, html_content: str) -> str:
        """Ana temizleme metodu. Bu metod override EDİLMEZ."""
        # Ortak (tüm kurumlar) + kuruma özel gürültü listelerini birleştirip
        # set'e çeviriyoruz: "line in ..." kontrolü set'te list'ten çok daha
        # hızlı çalışır (özellikle uzun sayfalarda fark yaratır).
        forbidden_terms_set = set(self.COMMON_FORBIDDEN_TERMS) | set(self.forbidden_terms)

        soup = BeautifulSoup(html_content, "html.parser")

        # 1: gürültü etiketlerini kaldır
        soup = self._strip_html_tags(soup)

        # 2: link yoğunluğu yüksek blokları ve widget blokları kaldır (menü/navigasyon tespiti)
        soup = self._remove_known_widget_blocks(soup)
        soup = self._remove_high_link_density_blocks(soup)

        # 3: düz metne çevir ve satır satır işle
        raw_text = soup.get_text(separator="\n").strip()
        lines = [line.strip() for line in raw_text.split("\n")]

        # 4: boş satırları ve kuruma özel bilinen gürültü satırlarını at
        # (tam eşleşme: satır birebir forbidden_terms'teki bir ifadeye eşitse silinir)
        filtered_lines = [
            line for line in lines
            if line and line not in forbidden_terms_set
        ]
        text = "\n".join(filtered_lines)

        # 5: fazladan boş satırları sadeleştir (3+ boş satır -> 1 boş satır)
        text = re.sub(r"\n{3,}", "\n\n", text)

        # 6: kuruma özel ayar (alt sınıflar burada devreye girer)
        text = self._institution_specific_fix(text)

        return text.strip()

    def _strip_html_tags(self, soup: BeautifulSoup) -> BeautifulSoup:
        """Script, nav, footer gibi her sitede aynı işi gören gürültü etiketlerini siler."""
        for tag in soup(self.TAGS_TO_REMOVE):
            tag.decompose()
        return soup

    def _remove_high_link_density_blocks(self, soup: BeautifulSoup) -> BeautifulSoup:
        """
        Link yoğunluğu yüksek olan blokları siler çünkü: Menü ve navigasyon listeleri neredeyse tamamen
        linklerden oluşur; gerçek içerik ise çoğunlukla düz metindir.
        """
        candidate_tags = soup.find_all(["div", "ul", "section", "aside"])

        for tag in candidate_tags:
            block_text = tag.get_text(strip=True)
            total_length = len(block_text)

            if total_length < self.MIN_BLOCK_LENGTH_FOR_DENSITY_CHECK:
                continue

            link_text_length = sum(
                len(a.get_text(strip=True)) for a in tag.find_all("a")
            )
            link_density = link_text_length / total_length if total_length else 0

            if link_density > self.LINK_DENSITY_THRESHOLD:
                tag.decompose()

        return soup
    
    def _remove_known_widget_blocks(self, soup: BeautifulSoup) -> BeautifulSoup:
        """
        Bilinen id veya class kalıplarına sahip widget/gürültü bloklarını
        (erişilebilirlik menüsü, breadcrumb vb.) siler.
        """
        # 1. id bazlı tarama
        for tag in soup.find_all(id=True):
            if tag.attrs is None:
                continue
            tag_id = tag.get("id", "").lower()
            for pattern in self.KNOWN_WIDGET_ID_PATTERNS:
                if pattern in tag_id:
                    tag.decompose()
                    break  # bu etiket zaten silindi, aynı etiket için tekrar kontrol etmeye gerek yok

        # 2. class bazlı tarama 
        for tag in soup.find_all(class_=True):
            if tag.attrs is None:
                continue
            tag_classes = " ".join(tag.get("class", [])).lower()
            for pattern in self.KNOWN_WIDGET_CLASS_PATTERNS:
                if pattern in tag_classes:
                    tag.decompose()
                    break

        return soup
        

    @abstractmethod
    def _institution_specific_fix(self, text: str) -> str:
        """
        Genel temizlikten sonra hâlâ kalan, kuruma özgü gürültü veya
        düzensizlikler için.
        """
        raise NotImplementedError


## KURUM ÖZEL CLASSLAR

class KOSGEBCleaner(BaseCleaner):
    # KOSGEB'in erişilebilirlik menüsü ve site başlığı çöp metinleri —
    # bu ifadeler sayfalar arasında tekrar eden gürültü satırları
    forbidden_terms = [
        "Erişilebilirlik Menüsü", "x", "Ekran Okuyucu", "Seçili Alan Okuyucu",
        "Bağlantı Vurgula", "Büyük Metin", "Metni Sola Hizala", "İmleç",
        "Okuma", "Disleksi Dostu", "Kontrast", "Solgunlaştırma",
        "Düşük Doygunluk", "Yüksek Doygunluk", "Erişilebilirlik Ayarlarını Temizle",
        "Tüm Liste", "Site içi arama", "e-hizmetler"
    ]

    def _institution_specific_fix(self, text: str) -> str:
        
        return text


class TubitakCleaner(BaseCleaner):
    # TÜBİTAK sayfalarında gözlemlenen, sabit ve tekrar eden gürültü satırları.
    # Not: "Ana içeriğe atla", "+", "-", "0", "Görsel" zaten COMMON_FORBIDDEN_TERMS
    # içinde (tüm kurumlarda ortak), burada tekrar yazmaya gerek yok.
    forbidden_terms: list[str] = []

    def _institution_specific_fix(self, text: str) -> str:
        return text


class KalkinmaAjansiCleaner(BaseCleaner):
    def _institution_specific_fix(self, text: str) -> str:
        return text


class GoogleCloudCleaner(BaseCleaner):
    def _institution_specific_fix(self, text: str) -> str:
        
        return text


class AwsCleaner(BaseCleaner):
    def _institution_specific_fix(self, text: str) -> str:
        
        return text


def get_cleaner(source_name: str) -> BaseCleaner:
    """Kurum ismine göre doğru cleaner örneğini döner."""
    
    # Harita yapısını bozmadan, isimleri upper() güvencesine alarak eşliyoruz 
    cleaners = {
        "KOSGEB": KOSGEBCleaner,
        "TUBITAK": TubitakCleaner,
        "KALKINMA_AJANSI": KalkinmaAjansiCleaner,
        "GOOGLE_CLOUD": GoogleCloudCleaner,  # Resmi olarak eklendi!
        "AWS": AwsCleaner,                  # Resmi olarak eklendi!
    }
    
    # input case-insensitive esneklik kazansın diye upper yapıyoruz
    cleaner_class = cleaners.get(source_name.upper())
    if cleaner_class is None:
        raise ValueError(f"Bilinmeyen kaynak için cleaner bulunamadı: {source_name}")
    return cleaner_class()