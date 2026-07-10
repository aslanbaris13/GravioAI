

from abc import ABC, abstractmethod
from models.raw_program import RawProgram
from core.cleaner import extract_text_from_html
from models.program import SupportProgramDB


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
    
    #girişimcilere uygun mu kontrolü?

    def is_relevant(self, text: str, title: str) -> bool:
        # Metod artık sınıfın başındaki listeyi kullanır
        content = (text + " " + title).lower()
        return any(keyword in content for keyword in self.relevance_keywords)
    
    def generate_id(self, text: str) -> str:
        """Supabase program ID üretir."""
        # 1. Küçük harfe çevir ve Türkçe karakterleri manuel değiştir
        replace = {
        "İ": "i", "I": "i", "ı": "i",
        "Ğ": "g", "ğ": "g",
        "Ü": "u", "ü": "u",
        "Ş": "s", "ş": "s",
        "Ö": "o", "ö": "o",
        "Ç": "c", "ç": "c",
    }
        
        for eski,yeni in replace.items():
            # Sadece harf, rakam (isalnum) veya boşluk ise kabul et
            text = text.replace(eski, yeni)
        text = text.lower()
        
        cln_txt = "".join(harf for harf in text if harf.isalnum() or harf == " ")
     
        kelimeler = cln_txt.split()
        
        # 4. Kelimeleri arasına tire (-) koyarak birleştir
        return "-".join(kelimeler)
    
    def format_to_db(self,extracted_info,url:str,raw_text:str) ->dict:
        """
        LLM'den gelen veriyi, veritabanına (Supabase) yazılacak standart formata sokar.
        bu metod sayesinde her veri, Supabase'e gitmeden önce tek bir kalıba (SupportProgramDB) sokulur.
        
        """
        readable_id = self.generate_id(extracted_info.program_name)
        
        db_record = SupportProgramDB(
            
            **extracted_info.model_dump(by_alias=False), # LLM'in bulduğu verileri (bütçe, başlık vs.) açarak içine koyar
            program_id=readable_id,                # Supabase için ID üretir
            source_url=url,                              # Verinin hangi linkten çekildiğini kaydeder
            body_chunk=raw_text                          # İleride yapay zekanın (RAG) metni okuyabilmesi için orijinal metni saklar
        )

    
        return db_record.model_dump(mode='json')