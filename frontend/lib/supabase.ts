/**
 * Supabase tarayıcı istemcisi — kimlik doğrulama için.
 *
 * Env değişkenleri henüz tanımlı değilse istemci `null` döner ve uygulama
 * kimlik doğrulaması olmadan (anonim `session_id` ile) eskisi gibi çalışmaya
 * devam eder. Böylece anahtarlar panelden gelene kadar giriş ekranları
 * mevcut akışı kırmıyor.
 *
 * Buraya YALNIZCA `anon public` anahtarı girer; `service_role` anahtarı
 * tarayıcıya asla verilmez (veritabanının tamamına yazma yetkisi taşır).
 */
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Kimlik doğrulama yapılandırılmış mı — giriş/kayıt bağlantılarını
 *  göstermeden önce kontrol edilir. */
export const isAuthConfigured = Boolean(URL_ && ANON_KEY);

let client: SupabaseClient | null = null;

/** Tarayıcı istemcisi (tekil). Yapılandırma yoksa `null`. */
export function getSupabase(): SupabaseClient | null {
  if (!isAuthConfigured) return null;
  if (!client) client = createBrowserClient(URL_!, ANON_KEY!);
  return client;
}
