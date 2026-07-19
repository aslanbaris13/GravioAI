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

    def clean(self, html_content: str, repeated_noise_lines: set[str] | None = None) -> str:
        """Ana temizleme metodu. Bu metod override EDİLMEZ."""
        if repeated_noise_lines is None:
            repeated_noise_lines = set()

        soup = BeautifulSoup(html_content, "html.parser")

        # 1: gürültü etiketlerini kaldır
        soup = self._strip_html_tags(soup)

        # 2: link yoğunluğu yüksek blokları ve widget blokları kaldır (menü/navigasyon tespiti)
        soup = self._remove_known_widget_blocks(soup)
        soup = self._remove_high_link_density_blocks(soup)

        # 3: düz metne çevir ve satır satır işle
        raw_text = soup.get_text(separator="\n").strip()
        lines = [line.strip() for line in raw_text.split("\n")]

        # 4: boş satırları ve sayfalar-arası tekrar eden gürültü satırlarını at
        filtered_lines = [
            line for line in lines
            if line and line not in repeated_noise_lines
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
    def _institution_specific_fix(self, text: str) -> str:
        # Şu an için genel temizlik yeterli, ekstra bir düzeltmeye gerek yok.
        return text


class TubitakCleaner(BaseCleaner):
    def _institution_specific_fix(self, text: str) -> str:
        return text


class KalkinmaAjansiCleaner(BaseCleaner):
    def _institution_specific_fix(self, text: str) -> str:
        return text


class GoogleCloudCleaner(BaseCleaner):
    def _institution_specific_fix(self, text: str) -> str:
        # Google Cloud için genel temizlik şu an gayet yeterli
        return text


class AwsCleaner(BaseCleaner):
    def _institution_specific_fix(self, text: str) -> str:
        # AWS Activate için genel temizlik şu an gayet yeterli
        return text


def get_cleaner(source_name: str) -> BaseCleaner:
    """Kurum ismine göre doğru cleaner örneğini döner."""
    
    # Harita yapısını bozmadan, isimleri upper() güvencesine alarak eşliyoruz kanka
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