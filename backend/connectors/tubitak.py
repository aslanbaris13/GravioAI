"""
connectors/tubitak.py

Fetches active support programs and calls from multiple TÜBİTAK pages,
covering both national and international/global opportunities.
"""
from bs4 import BeautifulSoup

from connectors.base import BaseConnector
from core.fetcher import BaseFetcher
from core.llm.factory import get_llm_client
from core.cleaner import BaseCleaner
from core.document_parser import extract_text


class TubitakConnector(BaseConnector):
    
    SOURCE_NAME = "TUBITAK"
    
    # Artık tüm destek sayfalarını taramıyoruz — sadece açık çağrılar sayfasını
    # kullanıyoruz, çünkü kullanıcı için asıl önemli olan "şu an başvurulabilir"
    # çağrılar. Diğer sayfalar (ulusal/uluslararası destek programları) bu
    # çağrıların arkasındaki genel programları listeliyordu, tekrar oluşturuyordu.
    OPEN_CALLS_URL = "https://tubitak.gov.tr/tr/acik-cagrilar"
    
    forbidden_terms = []

    def __init__(self, fetcher: BaseFetcher, cleaner: BaseCleaner | None = None):
        super().__init__(cleaner=cleaner)
        self.fetcher = fetcher
        self.base_domain = "https://tubitak.gov.tr"
        self.source_name = "TÜBİTAK"

    def _extract_call_links(self, html: str) -> list[tuple[str, str]]:
        """Açık çağrılar sayfasındaki her çağrı kaydından (link, başlık) çiftini çıkarır.

        """
        soup = BeautifulSoup(html, "html.parser")
        cagri_kartlari = soup.find_all("div", class_="views-row")

        call_links = []
        for kart in cagri_kartlari:
            baslik_bloku = kart.find("div", class_="c-baslik")
            if baslik_bloku is None:
                # Beklenen yapı yoksa bu kartı atla, tüm sayfayı çökertme
                continue

            link_etiketi = baslik_bloku.find("a", href=True)
            if link_etiketi is None:
                continue

            href = link_etiketi["href"]
            baslik = link_etiketi.text.strip()
            call_links.append((href, baslik))

        return call_links

    def _extract_pdf_links(self, html: str) -> list[tuple[str, str]]:
        """Bir çağrı detay sayfasındaki PDF belge linklerini (href, dosya_adi) olarak çıkarır.

        Aynı PDF linki sayfada iki kez geçebiliyor (dosya ikonu + indirme linki
        aynı href'i paylaşıyor), bu yüzden tekilleştirme yapıyoruz.
        """
        soup = BeautifulSoup(html, "html.parser")
        gorulen_hrefler = set()
        pdf_links = []

        for link_etiketi in soup.find_all("a", href=True):
            href = link_etiketi["href"]
            if not href.lower().endswith(".pdf"):
                continue
            if href in gorulen_hrefler:
                continue
            gorulen_hrefler.add(href)

            dosya_adi = link_etiketi.text.strip() or href.rsplit("/", 1)[-1]
            pdf_links.append((href, dosya_adi))

        return pdf_links

    async def fetch(self) -> list[dict]:
        print(f"{self.source_name}: Açık çağrılar sayfası taranıyor...\n")

        programs = []
        llm_client = get_llm_client()

        try:
            list_html = await self.fetcher.fetch_text(self.OPEN_CALLS_URL)
        except Exception as e:
            print(f" HATA: Açık çağrılar sayfası çekilemedi: {e}")
            return programs

        call_links = self._extract_call_links(list_html)
        print(f"{len(call_links)} açık çağrı bulundu.")

        for href, baslik in call_links:
            try:
                full_url = href if href.startswith("http") else self.base_domain + href

                print(f"Detaylar indiriliyor: {full_url}")
                detail_html = await self.fetcher.fetch_text(full_url)
                clean_txt = self.clean(detail_html)

                # Sayfadaki çağrı belgelerini (PDF) bul ve indir.
                # Her PDF kendi try/except'inde: biri bozuk/taranmış/çok büyük
                # olsa bile diğer PDF'ler ve HTML metni işlenmeye devam etsin.
                pdf_links = self._extract_pdf_links(detail_html)
                pdf_metinleri = []

                for pdf_href, dosya_adi in pdf_links:
                    try:
                        pdf_url = pdf_href if pdf_href.startswith("http") else self.base_domain + pdf_href
                        print(f" -> Çağrı belgesi indiriliyor: {dosya_adi}")

                        pdf_bytes = await self.fetcher.fetch_bytes(pdf_url)
                        pdf_metni = extract_text(pdf_bytes, filename=dosya_adi if dosya_adi.lower().endswith(".pdf") else f"{dosya_adi}.pdf")

                        pdf_metinleri.append(f"--- Çağrı Belgesi: {dosya_adi} ---\n{pdf_metni}")
                    except Exception as e:
                        print(f" UYARI: Çağrı belgesi okunamadı ({dosya_adi}): {e}")

                # HTML açıklaması + PDF metinlerini tek bir metinde birleştir
                birlesik_metin = clean_txt
                if pdf_metinleri:
                    birlesik_metin = clean_txt + "\n\n" + "\n\n".join(pdf_metinleri)

                print(f"Yapay zeka analiz ediyor: {baslik}")
                extracted_info = await llm_client.extract_program_details(
                    body_text=birlesik_metin, source_name=self.source_name
                )

                if extracted_info:
                    db_record = self.format_to_db(extracted_info, full_url, birlesik_metin, source_name=self.source_name)
                    programs.append(db_record)
                    print(f" Başarıyla ayrıştırıldı ve formatlandı: {baslik}")

            except Exception as e:
                print(f" HATA: Çağrı işlenemedi ({baslik}): {e}")

        print(f"\n{self.source_name}: Toplam {len(programs)} program işlendi.\n")
        return programs