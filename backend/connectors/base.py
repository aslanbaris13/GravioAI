import re
from abc import ABC, abstractmethod
from datetime import datetime

from models.raw_program import RawProgram
from core.cleaner import BaseCleaner, get_cleaner
from models.program import SupportProgram
from core.constants import AY_KISALTMALARI, BOS_ALAN_MESAJLARI, exclusion_keywords
from core.text_utils import turkce_slugify,turkce_lower


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
        ay = AY_KISALTMALARI.get(turkce_lower(ay_metni[:3]))
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
    
    exclusion_keywords = exclusion_keywords
    
    def __init__(self,cleaner:BaseCleaner|None=None):
        self.cleaner=cleaner or get_cleaner(self.SOURCE_NAME)
    
    
    @abstractmethod
    async def fetch(self) -> list[dict]:
        """
        Bu metod, connector'ın veriyi çekmesini sağlayacak.
        Her connector kendi fetch metodunu implement etmek zorunda.
        """
        pass

    def clean(self, raw_html: str) -> str:
        # core/cleaner.py dosyasındaki fonksiyonunu buraya çağıracağız
        return self.cleaner.clean(raw_html)
    
    # Hedef kitleye kesinlikle uymayan bir sektöre mi ait? (dışlama mantığı)
    def is_relevant(self, text: str, title: str) -> bool:
        # Varsayılan olarak her program uygun sayılır; sadece exclusion_keywords
        # listesindeki kelimelerden biri geçiyorsa (tarım, turizm, inşaat,
        # maden vb.) program elenir. Bkz. core/constants.py exclusive_keyword.
        content = turkce_lower(text + " " + title)
        return not any(keyword in content for keyword in self.exclusion_keywords)



    def generate_id(self, text: str) -> str:
        
        """Supabase program ID üretir (Türkçe karakterleri güvenli şekilde temizler)."""
        return turkce_slugify(text)

    def format_to_db(
    self,
    extracted_info,
    url: str,
    raw_text: str,
    source_name: str,
    region_override: str | None = None,) -> dict:
        
        """LLM çıktısını Supabase'e yazılacak standart formata sokar.

        source_name: connector'ın kendi bildiği sabit kurum adı (LLM'e güvenmek yerine).
        region_override: varsa (örn. Kalkınma Ajansı kodu), LLM'in bulduğu region'ın yerini alır.
        """
        readable_id = self.generate_id(extracted_info.title)

        if extracted_info.deadline:
            extracted_info.deadline = _normalize_deadline(extracted_info.deadline)

        extracted_info.source = source_name

        if region_override:
            extracted_info.region = region_override
        elif extracted_info.region is None:
            extracted_info.region = "Ulusal"

        for alan_adi, mesaj in BOS_ALAN_MESAJLARI.items():
            if getattr(extracted_info, alan_adi, None) is None:
                setattr(extracted_info, alan_adi, mesaj)

        db_record = SupportProgram(
            **extracted_info.model_dump(by_alias=False),
            program_id=readable_id,
            source_url=url,
            body_chunk=raw_text,
        )

        return db_record.model_dump(mode='json')