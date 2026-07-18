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


class TubitakConnector(BaseConnector):
    
    SOURCE_NAME = "TUBITAK"
    
    # Class-level constants for configuration management
    TARGET_URLS = [
        "https://tubitak.gov.tr/tr/acik-cagrilar",
        "https://tubitak.gov.tr/tr/destekler/sanayi/ulusal-destek-programlari",
        "https://tubitak.gov.tr/tr/destekler/sanayi/uluslararasi-programlar",
        "https://tubitak.gov.tr/tr/destekler/akademik/ulusal-destek-programlari",
        "https://tubitak.gov.tr/tr/destekler/akademik/uluslararasi-destek-programlari"
    ]
    
    forbidden_terms = []

    def __init__(self, fetcher: BaseFetcher, cleaner: BaseCleaner | None = None):
        super().__init__(cleaner=cleaner)
        self.fetcher = fetcher
        self.base_domain = "https://tubitak.gov.tr"
        self.source_name = "TÜBİTAK"

    def _is_program_link(self, href: str) -> bool:
        """Validates if the link corresponds to an actual program detail page."""
        son_parca = href.rstrip("/").split("/")[-1]
        if son_parca.startswith("icerik-"):
            son_parca = son_parca[len("icerik-"):]
        return son_parca[:1].isdigit()

    async def fetch(self) -> list[dict]:
        print(f"{self.source_name}: Scanning configured support and open call pages...\n")

        programs = []
        llm_client = get_llm_client()
        gorulen_linkler = set()

        # Iterate through target URLs to fetch active program updates
        for target_url in self.TARGET_URLS:
            print(f"-> Processing: {target_url}")
            try:
                html = await self.fetcher.fetch_text(target_url)
            except Exception as e:
                print(f" ⚠️ ERROR: Failed to fetch {target_url}: {e}")
                continue

            soup = BeautifulSoup(html, "html.parser")
            tum_linkler = soup.find_all("a", href=True)

            for link_etiketi in tum_linkler:
                try:
                    baslik = link_etiketi.text.strip()
                    href = link_etiketi["href"]

                    if not (href.startswith("/tr/destekler/") and len(baslik) > 20):
                        continue

                    full_url = self.base_domain + href
                    if full_url in gorulen_linkler:
                        continue
                    gorulen_linkler.add(full_url)

                    tarih_etiketi = link_etiketi.find_next("time", class_="datetime")
                    listeleme_tarihi = tarih_etiketi.text.strip() if tarih_etiketi else None

                    print(f"Downloading details: {full_url}")
                    detail_html = await self.fetcher.fetch_text(full_url)
                    clean_txt = self.clean(detail_html)

                    print(f"LLM analyzing: {baslik}")
                    extracted_info = await llm_client.extract_program_details(
                        body_text=clean_txt, source_name=self.source_name
                    )

                    if extracted_info:
                        if not extracted_info.deadline and listeleme_tarihi:
                            extracted_info.deadline = listeleme_tarihi

                        db_record = self.format_to_db(extracted_info, full_url, clean_txt, source_name=self.source_name)
                        programs.append(db_record)
                        print(f" Successfully formatted: {baslik}")

                except Exception as e:
                    print(f" ERROR: Failed to process link: {e}")

        print(f"\n{self.source_name}: Total of {len(programs)} programs processed.\n")
        return programs