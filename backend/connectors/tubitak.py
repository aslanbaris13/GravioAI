"""
connectors/tubitak.py

TÜBİTAK'ın "Açık Çağrılar" sayfasından (sadece ulusal/sanayi odaklı,
o an aktif olan çağrılar) güncel destek programlarını çeker.

Not: Uluslararası/global çağrılar bu sayfada yer almıyor, TÜBİTAK'ın
ayrı bir duyuru sistemi üzerinden yayınlanıyor. Bu, ileride ayrı bir
connector/iterasyon olarak ele alınacak.

Sayfadaki tüm <a> etiketleri (menü, footer dahil) taranıyor. Menü/
kategori linklerini (örn. /tr/destekler/sanayi) gerçek program
sayfalarından (örn. /tr/destekler/.../cagri-1831-yesil-inovasyon-...)
ayırt etmek için, TÜBİTAK'ın program sayfalarının URL'inin son
parçasının bir program numarasıyla (ör. "1831-...") ya da "icerik-"
öneki + numarayla (ör. "icerik-1509-...") başlamasından yararlanıyoruz.
"""
from bs4 import BeautifulSoup

from connectors.base import BaseConnector
from core.fetcher import BaseFetcher
from core.llm.factory import get_llm_client
from core.cleaner import BaseCleaner


"""
connectors/tubitak.py

TÜBİTAK'ın "Açık Çağrılar" sayfasından (sadece ulusal/sanayi odaklı,
o an aktif olan çağrılar) güncel destek programlarını çeker.

Not: Uluslararası/global çağrılar bu sayfada yer almıyor, TÜBİTAK'ın
ayrı bir duyuru sistemi üzerinden yayınlanıyor. Bu, ileride ayrı bir
connector/iterasyon olarak ele alınacak.

Sayfadaki tüm <a> etiketleri (menü, footer dahil) taranıyor. Menü/
kategori linklerini (örn. /tr/destekler/sanayi) gerçek program
sayfalarından (örn. /tr/destekler/.../cagri-1831-yesil-inovasyon-...)
ayırt etmek için, TÜBİTAK'ın program sayfalarının URL'inin son
parçasının bir program numarasıyla (ör. "1831-...") ya da "icerik-"
öneki + numarayla (ör. "icerik-1509-...") başlamasından yararlanıyoruz.
"""
from bs4 import BeautifulSoup

from connectors.base import BaseConnector
from core.fetcher import BaseFetcher
from core.llm.factory import get_llm_client
from core.cleaner import BaseCleaner


class TubitakConnector(BaseConnector):
    
    SOURCE_NAME = "TUBITAK"
    
    forbidden_terms = []

    def __init__(self, fetcher: BaseFetcher, cleaner: BaseCleaner | None = None):
        super().__init__(cleaner=cleaner)
        self.fetcher = fetcher
        self.main_list_url = "https://tubitak.gov.tr/tr/acik-cagrilar"
        self.base_domain = "https://tubitak.gov.tr"
        self.source_name = "TÜBİTAK"

    def _is_program_link(self, href: str) -> bool:
        """TÜBİTAK'ın gerçek program sayfaları, URL'in son parçasında bir
        program numarasıyla (örn. '1831-...') ya da 'icerik-' öneki +
        numarayla (örn. 'icerik-1509-...') başlar. Menü/kategori sayfaları
        (örn. '/tr/destekler/sanayi') bu kalıba uymaz, bu yüzden onları eleriz."""
        son_parca = href.rstrip("/").split("/")[-1]
        if son_parca.startswith("icerik-"):
            son_parca = son_parca[len("icerik-"):]
        return son_parca[:1].isdigit()

    async def fetch(self) -> list[dict]:
        print(f"{self.source_name}: Açık çağrılar sayfası taranıyor...\n")

        programs = []
        llm_client = get_llm_client()

        try:
            html = await self.fetcher.fetch_text(self.main_list_url)
        except Exception as e:
            print(f" HATA: Ana sayfa çekilirken hata oluştu: {e}")
            return programs

        soup = BeautifulSoup(html, "html.parser")
        tum_linkler = soup.find_all("a", href=True)

        gorulen_linkler = set()

        for link_etiketi in tum_linkler:
            try:
                baslik = link_etiketi.text.strip()
                href = link_etiketi["href"]

                if not (href.startswith("/tr/destekler/") and len(baslik) > 20):
                    continue

            # Menü/kategori linklerini ele, sadece gerçek program sayfalarını al
            # tüm /tr/destekler/ linkleri (kategori sayfaları dahil) çekilip
            # veritabanında gözlemlenecek, filtre ihtiyacı sonra netleştirilecek.

                # if not self._is_program_link(href):
                #     continue

                # KARAR BEKLİYOR: Bu connector base.py'deki is_relevant() (anahtar
                # kelime) filtresini hiç kullanmıyor — sayfa zaten "Açık Çağrılar"
                # (ulusal/sanayi odaklı) ile sınırlı olduğu için şimdilik her şeyin
                # girişimciyle alakalı olduğu varsayılıyor. kosgeb.py ve
                # kalkinma_ajansi.py'de aynı filtre kapalı bırakılmış; kota
                # tasarrufu (Gemini günlük limiti 20 istek) ile yanlış eleme riski
                # arasındaki tercih üç connector için birlikte netleştirilmeli.

                full_url = self.base_domain + href
                if full_url in gorulen_linkler:
                    continue
                gorulen_linkler.add(full_url)

                # Listeleme sayfasından, ücretsiz olarak başvuru tarihini yakala
                tarih_etiketi = link_etiketi.find_next("time", class_="datetime")
                listeleme_tarihi = tarih_etiketi.text.strip() if tarih_etiketi else None

                print(f"detaylar indiriliyor: {full_url}")
                detail_html = await self.fetcher.fetch_text(full_url)
                clean_txt = self.clean(detail_html)

                print(f"Yapay zeka analiz ediyor: {baslik}")
                extracted_info = await llm_client.extract_program_details(
                    body_text=clean_txt, source_name=self.source_name
                )

                if extracted_info:
                    if not extracted_info.deadline and listeleme_tarihi:
                        extracted_info.deadline = listeleme_tarihi

                    db_record = self.format_to_db(extracted_info, full_url, clean_txt, source_name=self.source_name)
                    programs.append(db_record)
                    print(f" Başarıyla ayrıştırıldı ve formatlandı: {baslik}")

            except Exception as e:
                print(f" HATA: Bir link işlenirken hata oluştu: {e}")

        print(f"\n{self.source_name}: Toplam {len(programs)} program işlendi.\n")
        return programs