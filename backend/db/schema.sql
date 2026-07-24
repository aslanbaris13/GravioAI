-- GravioAI — Supabase / Postgres şeması
-- Supabase dashboard → SQL Editor → bu dosyayı yapıştır → "Run".
-- Tekrar çalıştırılabilir (idempotent); mevcut yapıyı bozmaz.

-- 1) pgvector eklentisi
create extension if not exists vector;
create extension if not exists pgcrypto;

-- ============================================================
-- LEGACY — eski düz şema. `programs_v2` bölümü bunun yerini aldı
-- (bkz. feature/connector-layer). Var olan veriyi bozmamak için
-- tablo siliniyor değil, artık hiçbir kod buraya yazmıyor/okumuyor.
-- ============================================================

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

-- 6) [LEGACY] Bu fonksiyon artık aşağıdaki programs_v2 sürümüyle
--    değiştiriliyor (aynı isim+imza, farklı dönüş tipi — bu yüzden
--    CREATE OR REPLACE değil, önce DROP gerekiyor, aşağıda yapılıyor).
--    Burada sadece belgesel referans olarak bırakıldı, çalıştırılmıyor.

-- ============================================================
-- programs_v2 — güncel veri şeması (feature/connector-layer, PR #16).
-- backend/data/repo.py ve backend/models/program.py buradaki alan
-- adlarıyla birebir eşleşir.
-- ============================================================

-- 7) Ana program tablosu
create table if not exists public.programs_v2 (
    program_id           text primary key,
    title                text not null,
    category             text,
    source                text,
    support_type         text,
    amount_min           numeric,
    amount_max           numeric,
    currency             text default 'TRY',
    support_rate         text,
    application_status   text,
    region               text,
    founded_after        text,
    deadline             text,
    official_url         text,
    conditions_summary   text,
    women_entrepreneur   boolean,
    technopark           boolean,
    company_required     boolean,
    student              boolean,
    source_url           text not null,
    body_chunk           text not null,
    chunk_index          integer not null default 0,
    embedding            vector(768),
    created_at           timestamptz not null default now(),
    updated_at           timestamptz not null default now()
);

create index if not exists programs_v2_category_idx on public.programs_v2 (category);

create index if not exists programs_v2_embedding_idx
    on public.programs_v2 using hnsw (embedding vector_cosine_ops);

alter table public.programs_v2 enable row level security;

-- 8) Hiyerarşik chunking (core/chunker.py) — parent (anlamsal) bloklar
create table if not exists public.program_parents (
    id            uuid primary key default gen_random_uuid(),
    program_id    text not null references public.programs_v2 (program_id) on delete cascade,
    parent_index  integer not null,
    section_title text,
    text          text not null,
    created_at    timestamptz not null default now()
);

create index if not exists program_parents_program_id_idx on public.program_parents (program_id);

-- 9) Hiyerarşik chunking — embed edilip aranan child parçalar
create table if not exists public.program_chunks (
    id            uuid primary key default gen_random_uuid(),
    program_id    text not null references public.programs_v2 (program_id) on delete cascade,
    parent_id     uuid not null references public.program_parents (id) on delete cascade,
    chunk_index   integer not null,
    section_title text,
    text          text not null,
    embedding     vector(768),
    created_at    timestamptz not null default now()
);

create index if not exists program_chunks_program_id_idx on public.program_chunks (program_id);

create index if not exists program_chunks_embedding_idx
    on public.program_chunks using hnsw (embedding vector_cosine_ops);

alter table public.program_parents enable row level security;
alter table public.program_chunks enable row level security;

-- 10) Vektör benzerlik araması (RAG) — backend/data/repo.py bunu RPC
--     olarak çağırır. Eski (LEGACY) sürüm `programs` tablosunu
--     hedefliyordu; dönüş tipi değiştiği için CREATE OR REPLACE
--     yetmiyor, önce eski tanım düşürülüyor.
drop function if exists public.match_programs(vector(768), int, text);

create function public.match_programs(
    query_embedding vector(768),
    match_count int default 5,
    filter_category text default null
)
returns setof public.programs_v2
language sql
stable
as $$
    select *
    from public.programs_v2
    where embedding is not null
      and (filter_category is null or category = filter_category)
    order by embedding <=> query_embedding
    limit match_count;
$$;

-- ============================================================
-- user_sessions — sohbetin çıkardığı profil + eşleşmelerin kalıcılığı.
-- session_id'yi frontend (localStorage) üretir; burada auth yok,
-- session_id fiilen tahmin edilemeyen bir bearer-token gibi davranır.
-- ============================================================

-- 11) Oturum tablosu
create table if not exists public.user_sessions (
    session_id text primary key,
    profile     jsonb not null default '{}'::jsonb,
    matches     jsonb not null default '[]'::jsonb,
    updated_at  timestamptz not null default now()
);

-- 12) updated_at'i her upsert'te otomatik güncelleyen tetikleyici
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists user_sessions_set_updated_at on public.user_sessions;

create trigger user_sessions_set_updated_at
    before insert or update on public.user_sessions
    for each row execute function public.set_updated_at();

alter table public.user_sessions enable row level security;

-- ============================================================
-- applications — Panelim'deki başvuru durumu takibi (Faz B3'ün
-- ertelenen kısmı). Bir oturumun, bir programa dair başvuru sürecini
-- (taslak → hazırlanıyor → gönderildi) takip etmesini sağlar.
-- ============================================================

-- 13) Başvuru takip tablosu
create table if not exists public.applications (
    id             uuid primary key default gen_random_uuid(),
    session_id     text not null references public.user_sessions(session_id) on delete cascade,
    program_id     text not null,
    program_name   text not null,
    status         text not null default 'taslak'
                       check (status in ('taslak', 'hazirlaniyor', 'gonderildi')),
    note           text,
    reminder_date  date,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now(),
    unique (session_id, program_id)
);

create index if not exists applications_session_id_idx on public.applications(session_id);

-- 14) updated_at tetikleyicisi (12'deki fonksiyonu yeniden kullanır)
drop trigger if exists applications_set_updated_at on public.applications;

create trigger applications_set_updated_at
    before insert or update on public.applications
    for each row execute function public.set_updated_at();

alter table public.applications enable row level security;

-- ============================================================
-- presentations — üretilen şirket sunumlarının kalıcı arşivi.
-- "Sunumu oluştur" her çağrıldığında burada bir kayıt açılır; kullanıcı
-- sayfadan ayrılsa/geri dönse bile daha önce ürettiği sunumları görüp
-- tekrar .pptx olarak indirebilir (LLM'i tekrar çağırmadan — `slides`
-- tam JSON içerir, export-pptx bunu doğrudan kullanır).
-- ============================================================

-- 15) Sunum arşivi tablosu
create table if not exists public.presentations (
    id            uuid primary key default gen_random_uuid(),
    session_id    text not null references public.user_sessions(session_id) on delete cascade,
    title         text not null,
    subtitle      text,
    company_name  text,
    slides        jsonb not null default '[]'::jsonb,
    created_at    timestamptz not null default now()
);

create index if not exists presentations_session_id_idx on public.presentations(session_id);

alter table public.presentations enable row level security;
