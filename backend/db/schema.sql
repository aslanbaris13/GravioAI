-- GravioAI — Supabase / Postgres şeması
-- Supabase dashboard → SQL Editor → bu dosyayı yapıştır → "Run".
-- Tekrar çalıştırılabilir ; mevcut yapıyı bozmaz.

-- 1) pgvector eklentisi
create extension if not exists vector;
create extension if not exists pgcrypto;

-- ============================================================
-- LEGACY — eski düz şema (`programs` tablosu). Bu tablo, `programs_v2`
-- sürümünün getirilmesiyle (feature/connector-layer) kullanımdan
-- kaldırılmış, ardından RAG veri kalitesi çalışması sırasında
-- (backend-updates) veritabanından tamamen SİLİNMİŞTİR. Aşağıdaki
-- tanım artık hiçbir kod tarafından çalıştırılmıyor; yalnızca
-- tarihsel referans amacıyla belgesel olarak bırakılmıştır.
-- ============================================================

-- create table public.programs (
--     id                   text primary key,
--     category             text not null,
--     subcategory          text,
--     program_name         text not null,
--     institution          text,
--     support_type         text,
--     amount_min           numeric,
--     amount_max           numeric,
--     currency             text,
--     support_rate         text,
--     application_status   text,
--     application_start    date,
--     application_deadline date,
--     application_link     text,
--     official_source      text,
--     description          text,
--     target_audience      text,
--     sector               text,
--     company_required     boolean,
--     min_employees        integer,
--     max_employees        integer,
--     age_limit            text,
--     women_entrepreneur   boolean,
--     student              boolean,
--     technopark           boolean,
--     city                 text,
--     embedding            vector(768),
--     created_at           timestamptz not null default now(),
--     updated_at           timestamptz not null default now()
-- );


-- programs — güncel veri şeması (backend-updates branch'i, RAG veri
-- kalitesi çalışması). Önceki adı `programs_v2` idi; TÜBİTAK açık
-- çağrılar akışı + is_relevant/cleaner düzeltmeleriyle üretilen veri
-- doğrulandıktan sonra RENAME edildi.
-- backend/data/repo.py ve backend/models/program.py buradaki alan
-- adlarıyla birebir eşleşir.


-- 2) Ana program tablosu
create table if not exists public.programs (
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
    last_updated         timestamptz not null default timezone('utc'::text, now()));

create index if not exists programs_category_idx on public.programs (category);

create index if not exists programs_embedding_idx
    on public.programs using hnsw (embedding vector_cosine_ops);

alter table public.programs enable row level security;

-- 3) Hiyerarşik chunking (core/chunker.py) — parent (anlamsal) bloklar
--    ON DELETE CASCADE: bir program silindiğinde ona ait parent/child
--    chunk'ların da otomatik silinmesini sağlar (backend-updates'te
--    eklendi — önceki _v3 tablolarında bu eksikti, sonradan
--    ALTER TABLE ile tamamlandı).
create table if not exists public.program_parents (
    id            uuid primary key default gen_random_uuid(),
    program_id    text not null references public.programs (program_id) on delete cascade,
    parent_index  integer not null,
    section_title text,
    text          text not null,
    created_at    timestamptz not null default now()
);

create index if not exists program_parents_program_id_idx on public.program_parents (program_id);

alter table public.program_parents enable row level security;

-- 4) Hiyerarşik chunking — embed edilip aranan child parçalar
create table if not exists public.program_chunks (
    id            uuid primary key default gen_random_uuid(),
    program_id    text not null references public.programs (program_id) on delete cascade,
    parent_id     uuid not null references public.program_parents (id) on delete cascade,
    chunk_index   integer not null,
    section_title text,
    text          text not null,
    embedding     vector(768),
    created_at    timestamptz not null default now()
);

create index if not exists program_chunks_program_id_idx on public.program_chunks (program_id);

create index if not exists program_chunks_embedding_idx
    on public.program_chunks using hnsw (embedding vector_cosine_ops)
    with (m = 16, ef_construction = 64);

alter table public.program_chunks enable row level security;

-- 5) Vektör benzerlik araması (RAG) — backend/data/repo.py bunu RPC
--    olarak çağırır.
--
--    backend-updates güncellemesi: eski sürüm doğrudan programs
--    tablosunun kendi embedding'i üzerinde arıyordu (program-seviyeli).
--    Yeni sürüm, hiyerarşik chunking'in "küçük parçayla bul, büyük
--    parçayla cevapla" prensibine uygun olarak program_chunks
--    üzerinde arar ve DISTINCT ON ile her programı SADECE 1 KEZ
--    döndürür (aynı programın birden fazla chunk'ı eşleşse bile).
i
drop function if exists public.match_programs(vector, integer, text);

create function public.match_programs(
    query_embedding vector(768),
    match_count integer default 5,
    filter_category text default null
)
returns setof public.programs
language sql
stable
as $$
    with en_yakin_chunklar as (
        select distinct on (p.program_id)
            p.*,
            c.embedding <=> query_embedding as mesafe
        from public.program_chunks c
        join public.programs p on p.program_id = c.program_id
        where filter_category is null or p.category = filter_category
        order by p.program_id, mesafe asc
    )
    select
        program_id, title, category, source, support_type, amount_min,
        amount_max, currency, support_rate, application_status, region,
        founded_after, deadline, official_url, conditions_summary,
        women_entrepreneur, technopark, company_required, student,
        source_url, body_chunk, chunk_index, embedding 
    from en_yakin_chunklar
    order by mesafe asc
    limit match_count;
$$;

-- user_sessions — sohbetin çıkardığı profil + eşleşmelerin kalıcılığı.
-- session_id'yi frontend (localStorage) üretir; burada auth yok,


-- 6) Oturum tablosu
create table if not exists public.user_sessions (
    session_id text primary key,
    profile     jsonb not null default '{}'::jsonb,
    matches     jsonb not null default '[]'::jsonb,
    updated_at  timestamptz not null default now()
);

-- 7) updated_at'i her upsert'te otomatik güncelleyen tetikleyici
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


-- applications — Panelim'deki başvuru durumu takibi 



-- 8) Başvuru takip tablosu
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

-- 9) updated_at tetikleyicisi (7'deki fonksiyonu yeniden kullanır)
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

-- ============================================================
-- ingestion_runs — veri senkronizasyonu (scrape + ingest) geçmişi.
-- `data-sync` GitHub Actions workflow'u her çalıştırmada kaynak başına
-- (kosgeb/kalkinma/tubitak/ingest_batch) bir satır yazar (bkz.
-- backend/data/repo.py:log_ingestion_run) — panelde "veri ne zaman
-- güncellendi" göstermek için okunur.
-- ============================================================

create table if not exists public.ingestion_runs (
    id               uuid primary key default gen_random_uuid(),
    source           text not null,
    status           text not null,
    docs_found       integer not null default 0,
    chunks_upserted  integer not null default 0,
    error_msg        text,
    started_at       timestamptz not null,
    finished_at      timestamptz not null,
    created_at       timestamptz not null default now()
);

create index if not exists ingestion_runs_started_at_idx on public.ingestion_runs (started_at desc);

alter table public.ingestion_runs enable row level security;
