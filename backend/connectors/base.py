import re
from abc import ABC, abstractmethod
from datetime import datetime
from models.raw_program import RawProgram
from core.cleaner import extract_text_from_html
from models.program import SupportProgramDB


# Farklı kaynaklardan gelen tarih metinlerini (İngilizce ay adı, Türkçe kısaltma,
# saat eki vb.) standart YYYY-MM-DD formatına çevirmek için kullanılan yardımcılar.
_AY_KISALTMALARI = {
    "oca": 1, "jan": 1, "sub": 2, "şub": 2, "feb": 2, "mar": 3,
    "nis": 4, "apr": 4, "may": 5, "haz": 6, "jun": 6, "tem": 7, "jul": 7,
    "agu": 8, "ağu": 8, "aug": 8, "eyl": 9, "sep": 9, "eki": 10, "oct": 10,
    "kas": 11, "nov": 11, "ara": 12, "dec": 12,
}


def _normalize_deadline(raw: str | None) -> str | None:
    """Farklı formattaki tarihleri (16 May 2024, 15 Haz 2026 vb.) YYYY-MM-DD'ye çevirir.
    Tanınmayan bir format gelirse, veri kaybetmemek için olduğu gibi döner."""
    if not raw:
        return raw

    raw = raw.strip()

    # Zaten ISO formatındaysa (2026-07-17), dokunma
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", raw):
        return raw

    # "16 May 2024 - 00:00" / "15 Haz 2026" gibi kalıplar
    m = re.search(r"(\d{1,2})\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)\s+(\d{4})", raw)
    if m:
        gun, ay_metni, yil = m.groups()
        ay = _AY_KISALTMALARI.get(ay_metni[:3].lower().replace("ı", "i"))
        if ay:
            try:
                return datetime(int(yil), ay, int(gun)).strftime("%Y-%m-%d")
            except ValueError:
                pass

    # Tanınmayan format, olduğu gibi bırak
    return raw


class BaseConnector(ABC):

    """
    Bu bizim ana şablonumuz.
    Bütün kurumların connector'ları bu sınıftan türetilecek.
    Böylece hepsinin aynı standartta (fetch metoduna sahip) olmasını garanti altına alıyoruz.
    """
    forbidden_terms = []
    relevance_keywords = ["girişimci", "iş kurma", "startup", "kuluçka", "yeni işletme"]

    @abstractmethod
    async def fetch(self) -> list[dict]:
        """
        Bu metod, connector'ın veriyi çekmesini sağlayacak.
        Her connector kendi fetch metodunu implement etmek zorunda.
        """
        pass

    def clean(self, raw_html: str) -> str:
        # core/cleaner.py dosyasındaki fonksiyonunu buraya çağıracağız
        return extract_text_from_html(raw_html, forbidden_terms=self.forbidden_terms)

    # girişimcilere uygun mu kontrolü?
    def is_relevant(self, text: str, title: str) -> bool:
        # Metod artık sınıfın başındaki listeyi kullanır
        content = (text + " " + title).lower()
        return any(keyword in content for keyword in self.relevance_keywords)

    def generate_id(self, text: str) -> str:
        """Supabase program ID üretir (Türkçe karakterleri güvenli şekilde temizler)."""
        değişimler = {
            "İ": "i", "I": "i", "ı": "i",
            "Ğ": "g", "ğ": "g",
            "Ü": "u", "ü": "u",
            "Ş": "s", "ş": "s",
            "Ö": "o", "ö": "o",
            "Ç": "c", "ç": "c",
        }
        for eski, yeni in değişimler.items():
            text = text.replace(eski, yeni)
        text = text.lower()

        cln_txt = "".join(harf for harf in text if harf.isalnum() or harf == " ")
        kelimeler = cln_txt.split()
        return "-".join(kelimeler)

    def format_to_db(self, extracted_info, url: str, raw_text: str) -> dict:
        """
        LLM'den gelen veriyi, veritabanına (Supabase) yazılacak standart formata sokar.
        bu metod sayesinde her veri, Supabase'e gitmeden önce tek bir kalıba (SupportProgramDB) sokulur.
        """
        readable_id = self.generate_id(extracted_info.title)

        # Deadline'ı standart formata çevir (LLM her kaynaktan farklı format dönebiliyor)
        if extracted_info.deadline:
            extracted_info.deadline = _normalize_deadline(extracted_info.deadline)

        db_record = SupportProgramDB(
            **extracted_info.model_dump(by_alias=False),  # LLM'in bulduğu verileri (bütçe, başlık vs.) açarak içine koyar
            program_id=readable_id,                        # Supabase için benzersiz bir ID üretir
            source_url=url,                                # Verinin hangi linkten çekildiğini kaydeder
            body_chunk=raw_text,                            # İleride yapay zekanın (RAG) metni okuyabilmesi için orijinal metni saklar
        )

        return db_record.model_dump(mode='json')