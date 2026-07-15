"""
Embedding katmanı — metni sayısal vektöre çeviren sağlayıcı-bağımsız arayüz.
"""
from abc import ABC, abstractmethod
from functools import lru_cache


import os
import uuid
from langchain_experimental.text_splitter import SemanticChunker
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter


from .config import Settings, get_settings


class EmbeddingClient(ABC):
    """Bütün embedder'ların (gemini, openai..) buna uyması gerek"""

    @abstractmethod
    async def embed_text(self, text: str) -> list[float]:
        """Verilen metni sayısal bir vektöre çevirir."""
        raise NotImplementedError
    
    @abstractmethod
    def get_langchain_embeddings(self):
            """
            LangChain uyumlu embedding nesnesini döner .

            Bu metodun amacı: chunker.py, GeminiEmbeddingClient'ın İÇİNDE
            `lc_embeddings` diye bir attribute olduğunu bilmemeli — sadece
            ABC üzerinden "bana LangChain embedding nesnesini ver" diyebilmeli.
            """
            raise NotImplementedError
    


class GeminiEmbeddingClient(EmbeddingClient):
    """Gemini embedding modelini kullanan somut uygulama."""

    def __init__(self, api_key: str, model: str) -> None:
        
        self._model=model
        self.lc_embeddings = GoogleGenerativeAIEmbeddings(
            model=self._model,
            google_api_key=api_key,
            task_type="retrieval_document",
            output_dimensionality=768
        ) 
        
        
    async def embed_text(self, text: str) -> list[float]:
        """Metni LangChain üzerinden asenkron embed eder"""

        return await self.lc_embeddings.aembed_query(text)

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        # Çoklu metinleri tek API çağrısında işler
        return await self.lc_embeddings.aembed_documents(texts)

    def get_langchain_embeddings(self):
        
        return self.lc_embeddings
    
def build_embedding_client(settings) -> EmbeddingClient:
    """Config'e göre doğru embedding sağlayıcı  üretir."""
    provider = settings.embedding_provider.lower()

    if provider == "gemini":
        return GeminiEmbeddingClient(
            api_key=settings.gemini_api_key,
            model=settings.embedding_model,
        )

    raise ValueError(f"Desteklenmeyen embedding sağlayıcı: {settings.embedding_provider!r}")    
    
@lru_cache
def get_embedding_client() -> EmbeddingClient:
    return build_embedding_client(get_settings())