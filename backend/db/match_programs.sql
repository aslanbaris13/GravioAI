-- ============================================================
-- match_programs RPC FONKSİYONU
-- Amaç: query_embedding'e en yakın program_chunks_v3 kayıtlarını bulur,
-- her programı SADECE 1 KEZ döndürür (en iyi eşleşen chunk'ı temsilci
-- alarak), ve SupportProgram modelinin beklediği program-seviyesi
-- kolonları (programs_v3'ten) geri verir.
--
-- repo.py'daki çağrı ile parametre isimleri birebir eşleşmeli:
--   query_embedding (vector), match_count (int), filter_category (text, null olabilir)
-- ============================================================

create or replace function public.match_programs(
    query_embedding vector(768),
    match_count integer default 5,
    filter_category text default null
)
returns setof public.programs_v3
language sql
stable
as $$
    -- 1) En yakın chunk'ları bul, programs_v3 ile join et (kategori filtresi
    --    burada uygulanıyor ki gereksiz chunk'lar erken elensin).
    -- 2) DISTINCT ON (p.program_id) ile her programdan sadece EN YAKIN
    --    chunk'ı tut — aynı programın birden fazla chunk'ı eşleşse bile
    --    program sonuçta yalnızca 1 kez görünür.
    -- 3) Mesafeye göre sırala, match_count kadar sınırla.
    with en_yakin_chunklar as (
        select distinct on (p.program_id)
            p.*,
            c.embedding <=> query_embedding as mesafe
        from public.program_chunks_v3 c
        join public.programs_v3 p on p.program_id = c.program_id
        where filter_category is null or p.category = filter_category
        order by p.program_id, mesafe asc
    )
    select
        id, program_id, body_chunk, chunk_index, embedding, title, source,
        category, support_type, amount_min, amount_max, currency, support_rate,
        application_status, region, founded_after, deadline, women_entrepreneur,
        technopark, company_required, student, official_url, conditions_summary,
        last_updated, source_url
    from en_yakin_chunklar
    order by mesafe asc
    limit match_count;
$$;