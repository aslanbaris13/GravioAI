
from abc import ABC, abstractmethod
from models.raw_program import RawProgram



class BaseConnector(ABC):

    """
    Bu bizim ana şablonumuz.
    Bütün kurumların connector'ları bu sınıftan türetilecek.
    Böylece hepsinin aynı standartta (fetch metoduna sahip) olmasını garanti altına alıyoruz.
    """

    @abstractmethod
    async def fetch(self) -> list[RawProgram]:
        """
        Bu metod, connector'ın veriyi çekmesini sağlayacak.
        Her connector kendi fetch metodunu implement etmek zorunda.
        """
        pass