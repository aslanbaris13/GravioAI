/**
 * Supabase'in e-posta doğrulama / şifre sıfırlama bağlantılarının döndüğü yer.
 *
 * Bağlantıdaki tek kullanımlık `code`, burada gerçek bir oturuma çevrilir ve
 * çerezlere yazılır. Bu rota olmadan kullanıcı maildeki linke tıklar ve
 * hiçbir şey olmaz — Supabase panelindeki "Redirect URLs" listesine bu
 * adresin eklenmiş olması gerekir.
 */
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  // Şifre sıfırlamada kullanıcıyı yeni şifre ekranına götürmek için
  // `?next=/sifre-sifirla` ile çağrılır; varsayılan sohbet ekranı.
  const next = url.searchParams.get("next") ?? "/chat";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!code || !supabaseUrl || !anonKey) {
    return NextResponse.redirect(new URL("/giris?hata=baglanti", url.origin));
  }

  const cookieStore = cookies();
  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        for (const { name, value, options } of list) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/giris?hata=dogrulama", url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
