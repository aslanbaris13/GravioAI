-- ============================================================
-- YENİ (v3) TABLOLARI OLUŞTURMA
-- Mevcut programs_v2 / program_parents / program_chunks tablolarına
-- dokunmadan, aynı şemayla YENİ tablolar oluşturur. Yeni scrape +
-- ingest akışı bu tablolara yazacak; veri doğrulandıktan sonra
-- eski tablolar silinip bu tablolar kalıcı isimlerine taşınacak.
-- ============================================================

-- 1) programs_v3 — programs_v2'nin birebir kopyası (id/program_id/embedding
--    dahil tüm kolonlar, information_schema sorgusuyla doğrulanan şemaya göre)
create table public.programs_v3 (
    id                  bigint generated always as identity primary key,
    program_id          text not null unique,
    body_chunk          text not null,
    chunk_index         integer not null default 0,
    embedding           vector(768),
    title               text not null,
    source              text,
    category            text,
    support_type        text,
    amount_min          numeric,
    amount_max          numeric,
    currency            text default 'TRY',
    support_rate        text,
    application_status  text,
    region              text,
    founded_after       text,
    deadline            text,
    women_entrepreneur  boolean,
    technopark          boolean,
    company_required    boolean,
    student             boolean,
    official_url        text,
    conditions_summary  text,
    last_updated        timestamptz default timezone('utc'::text, now()),
    source_url          text
);

-- 2) program_parents_v3 — programs_v3.program_id'ye foreign key
create table public.program_parents_v3 (
    id             uuid primary key default gen_random_uuid(),
    program_id     text not null references public.programs_v3(program_id),
    parent_index   integer not null,
    section_title  text,
    text           text not null,
    created_at     timestamptz default now()
);

-- 3) program_chunks_v3 — hem programs_v3 hem program_parents_v3'e foreign key
create table public.program_chunks_v3 (
    id             uuid primary key default gen_random_uuid(),
    program_id     text not null references public.programs_v3(program_id),
    parent_id      uuid not null references public.program_parents_v3(id),
    chunk_index    integer not null,
    section_title  text,
    text           text not null,
    embedding      vector(768),
    created_at     timestamptz default now()
);

-- 4) HNSW index — yol haritası dokümanının önerdiği ayarlarla
--    (vector_cosine_ops, m=16, ef_construction=64)
create index program_chunks_v3_embedding_idx
    on public.program_chunks_v3
    using hnsw (embedding vector_cosine_ops)
    with (m = 16, ef_construction = 64);