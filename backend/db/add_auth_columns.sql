--  Kimlik doğrulama için sahiplik kolonları
--
-- Bugün user_sessions / applications / presentations kayıtlarının sahibi yok;
-- yalnızca tarayıcıda üretilen `session_id` ile tutuluyorlar. Bu yüzden:
--   1. Giriş yapmak veriyi cihazlar arası taşımıyor (sorgu hâlâ session_id ile),
--   2. Backend "bu kaydı isteyen kişi sahibi mi?" sorusunu cevaplayamıyor,
--      dolayısıyla token doğrulaması (Aşama 3) tek başına bir işe yaramıyor.
--
-- Bu migration her tabloya bir sahip alanı ekler:
--   user_id NULL  -> anonim kayıt, bugünkü davranış aynen sürer
--   user_id dolu  -> o hesaba ait, yalnızca geçerli token'la erişilebilir
--
-- `session_id` kolonları BİLEREK korunuyor: hem anonim kullanıcıların tek
-- anahtarı, hem de devralma adımında (Aşama 5) hangi anonim oturumun hangi
-- hesaba bağlanacağını belirleyen alan.
--
-- ON DELETE CASCADE tercihi, Aydınlatma Metni'ndeki taahhütle uyumludur:
-- "Hesabınızı sildiğinizde profil, oturum ve rapor verileriniz makul bir süre
-- içinde sistemlerimizden kalıcı olarak silinir."
--
-- Idempotent: tekrar çalıştırılması güvenlidir.

alter table public.user_sessions
    add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.applications
    add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.presentations
    add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Yetkilendirme sorguları user_id üzerinden filtreleyecek.
create index if not exists user_sessions_user_id_idx on public.user_sessions (user_id);
create index if not exists applications_user_id_idx  on public.applications  (user_id);
create index if not exists presentations_user_id_idx on public.presentations (user_id);
