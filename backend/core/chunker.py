"""
    program_parents
├── id (uuid, primary key)
├── program_id (foreign key → programs_v2.program_id)
├── parent_index (int)
├── section_title (text)
├── text (text)
└── created_at (timestamptz, default now())

program_chunks
├── id (uuid, primary key)
├── program_id (foreign key → programs_v2.program_id)
├── parent_id (foreign key → program_parents.id)
├── chunk_index (int)
├── section_title (text)
├── text (text)
├── embedding (vector(768))
└── created_at (timestamptz, default now())

"""

import uuid
from langchain_experimental.text_splitter import SemanticChunker
from langchain_text_splitters import RecursiveCharacterTextSplitter
# from core.embedding import EmbeddingClient (Projenin yapısına göre importu sağla)

class HierarchicalChunker:
    """
    Bir programın body_chunk metnini iki seviyeli hiyerarşiye böler:
    - Parent: SemanticChunker ile bulunan büyük, anlamsal bütünlüğü olan bloklar.
    - Child: her parent'ın içini RecursiveCharacterTextSplitter ile bölen,
      embed edilip aranacak küçük parçalar.
    """
    def __init__(
        self,
        embedding_client, # EmbeddingClient tipinde
        breakpoint_threshold_amount: float = 85.0,
        child_chunk_size: int = 400,
        child_chunk_overlap: int = 60,
    ) -> None:
        
        self.embedding_client = embedding_client

        # SemanticChunker'ı kur
        self.semantic_parent_splitter = SemanticChunker(
            self.embedding_client.get_langchain_embeddings(), # LangChain objesini verdik
            breakpoint_threshold_type="percentile",
            breakpoint_threshold_amount=breakpoint_threshold_amount
        )

        # Child Splitter'ı kurma, cümle sınırlarına dikkat ediyor
        self.child_splitter = RecursiveCharacterTextSplitter(
            chunk_size=child_chunk_size,
            chunk_overlap=child_chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", "! ", "? ", " ", ""]
        )

    
    async def chunk_program(self, body_chunk: str, program_id: str) -> tuple[list[dict], list[dict]]:
        """Bir programın body_chunk metnini parent + child listelerine böler."""
        
        # Boş listeleri hazırlama
        parent_rows = []
        child_rows = []

        # Parent'lara bölme
        parent_docs = self.semantic_parent_splitter.create_documents([body_chunk])

        # Parent_docs üzerinde döngü
        for parent_index, parent_doc in enumerate(parent_docs):
            # Parent için benzersiz UUID
            parent_id = str(uuid.uuid4())
            section_title = parent_doc.page_content.strip()[:60]
            
            #Parent dict'ini listeye ekleme
            parent_rows.append({
                "id": parent_id,
                "program_id": program_id,
                "parent_index": parent_index,
                "text": parent_doc.page_content,
                "section_title": section_title, 
                
            })

            # Child'lara böl
            child_docs = self.child_splitter.create_documents([parent_doc.page_content])

            # Child yoksa geç
            if not child_docs:
                continue

            # Asenkron Embedding 
            child_texts = [f"{section_title}\n{doc.page_content}" for doc in child_docs]
            
            child_vectors = await self.embedding_client.embed_batch(child_texts)

            # Child dict'lerini listeye ekle
            # Kendi parent'ı içindeki sırayı takip ediyoruz
            for chunk_index, (c_text, c_vector) in enumerate(zip(child_texts, child_vectors)):
                child_id = str(uuid.uuid4())
                child_rows.append({
                    "id": child_id,
                    "program_id": program_id,
                    "parent_id": parent_id,
                    "chunk_index": chunk_index, 
                    "text": c_text,
                    "section_title": section_title,
                    "embedding": c_vector
                })

        # Tuple döndür
        return parent_rows, child_rows