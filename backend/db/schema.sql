-- GravioAI — Supabase / Postgres şeması
-- Supabase dashboard → SQL Editor → bu dosyayı yapıştır → "Run".
-- Tekrar çalıştırılabilir (idempotent); mevcut yapıyı bozmaz.

-- 1) pgvector eklentisi
create extension if not exists vector;

-- 2) Destek programları tablosu
--    Kolon adları backend domain modeliyle (İngilizce alan adları) eşleşir.
--    Embedding boyutu 768 (Gemini gemini-embedding-001, output_dimensionality=768).
create table if not exists public.programs (
    id                   text primary key,
    category             text not null,
    subcategory          text,
    program_name         text not null,
    institution          text,
    support_type         text,
    amount_min           numeric,
    amount_max           numeric,
    currency             text,
    support_rate         text,
    application_status   text,
    application_start    date,
    application_deadline date,
    application_link     text,
    official_source      text,
    description          text,
    target_audience      text,
    sector               text,
    company_required     boolean,
    min_employees        integer,
    max_employees        integer,
    age_limit            text,
    women_entrepreneur   boolean,
    student              boolean,
    technopark           boolean,
    city                 text,
    embedding            vector(768),
    created_at           timestamptz not null default now(),
    updated_at           timestamptz not null default now()
);

-- 3) Kategoriye göre filtreleme için indeks
create index if not exists programs_category_idx on public.programs (category);

-- 4) Vektör benzerlik araması için HNSW indeksi (kosinüs mesafesi)
create index if not exists programs_embedding_idx
    on public.programs using hnsw (embedding vector_cosine_ops);

-- 5) RLS: tablo yalnızca backend (service_role) tarafından kullanılır.
--    RLS açık + public policy yok => anon/authenticated erişemez, service_role bypass eder.
alter table public.programs enable row level security;

-- 6) Vektör benzerlik araması (RAG) — backend bunu RPC olarak çağırır.
create or replace function public.match_programs(
    query_embedding vector(768),
    match_count int default 5,
    filter_category text default null
)
returns setof public.programs
language sql
stable
as $$
    select *
    from public.programs
    where embedding is not null
      and (filter_category is null or category = filter_category)
    order by embedding <=> query_embedding
    limit match_count;
$$;
