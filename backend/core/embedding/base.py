from abc import ABC, abstractmethod


class EmbeddingClient(ABC):
    """Bütün embedder'ların (gemini, openai..) buna uyması gerek"""

    @abstractmethod
    async def embed_text(self, text: str) -> list[float]:
        """Verilen metni sayısal bir vektöre çevirir."""
        raise NotImplementedError