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

import re
import uuid
from langchain_experimental.text_splitter import SemanticChunker
from langchain_text_splitters import RecursiveCharacterTextSplitter
# from core.embedding import EmbeddingClient (Projenin yapısına göre importu sağla)

# Deterministik UUID üretimi için sabit isim uzayı 
# uuid.uuid5(namespace, name) kullanılır: aynı program_id + parent_index her zaman aynı ID üretir, böylece ingest
# tekrarlarında duplicate satır birikmez. Bu sabit asla değiştirilmemeli.
_GRAVIOAI_NAMESPACE = uuid.UUID("7c9e6a8f-1b3d-4f2a-9c5e-8d4b2a1f6e3c")

# Connector'ların (TÜBİTAK, KOSGEB, Kalkınma Ajansı vb.) body_chunk metnine
# eklediği bölüm/ek işaretleyicilerini tanıyan genel desen: "--- başlık ---"
# şeklindeki her satır bir bölüm başlığı sayılır. Kurumun kelimeleri önemli
# değil, sadece sarma deseni — yeni kurum eklense de kod değişmeden çalışır.
_SECTION_MARKER_PATTERN = re.compile(r"^---\s*(.+?)\s*---$")


def _extract_section_title(parent_text: str, fallback_length: int = 60) -> str:
    """Bir parent metninin section_title'ını çıkarır.

    "--- başlık ---" işaretleyicisi varsa (ör. TÜBİTAK PDF ekleri) içindeki
    başlığı döner. Yoksa ilk fallback_length karakteri alır, ama kelimeyi
    yarım bırakmamak için son tam kelimeye kadar geri gider.
    """
    ilk_satir = parent_text.strip().splitlines()[0] if parent_text.strip() else ""

    eslesme = _SECTION_MARKER_PATTERN.match(ilk_satir)
    if eslesme:
        return eslesme.group(1)

    temiz_metin = parent_text.strip()
    kesilmis = temiz_metin[:fallback_length]

    # Kelime ortasında kesilmesin diye son tam kelimeye geri dön
    if len(temiz_metin) > fallback_length and " " in kesilmis:
        kesilmis = kesilmis.rsplit(" ", 1)[0]

    return kesilmis


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
        breakpoint_threshold_amount: float = 90.0,
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
            # Deterministik ID: aynı program_id + parent_index -> aynı UUID(veriler güncellendiğinde eski verilerin id'si ile aynı olup üzerine yazabilmesi için)
            parent_id = str(uuid.uuid5(_GRAVIOAI_NAMESPACE, f"{program_id}:parent:{parent_index}"))
            section_title = _extract_section_title(parent_doc.page_content)
            
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
                # program_id + parent_index + chunk_index -> aynı UUID
                child_id = str(uuid.uuid5(
                    _GRAVIOAI_NAMESPACE, f"{program_id}:parent:{parent_index}:chunk:{chunk_index}"
                ))
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