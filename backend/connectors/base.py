
from abc import ABC, abstractmethod
from models.raw_program import RawProgram
from core.cleaner import extract_text_from_html


class BaseConnector(ABC):

    """
    Bu bizim ana şablonumuz.
    Bütün kurumların connector'ları bu sınıftan türetilecek.
    Böylece hepsinin aynı standartta (fetch metoduna sahip) olmasını garanti altına alıyoruz.
    """
    forbidden_terms = []
    relevance_keywords = ["girişimci", "iş kurma", "startup", "kuluçka", "yeni işletme"]

    @abstractmethod
    async def fetch(self) -> list[RawProgram]:
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
        # Metod artık sınıfın tepesindeki listeyi kullanır
        content = (text + " " + title).lower()
        return any(keyword in content for keyword in self.relevance_keywords)