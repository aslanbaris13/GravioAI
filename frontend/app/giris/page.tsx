"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell, { AuthNotice, authButtonStyle, authInputStyle, authLabelStyle } from "@/components/AuthShell";
import { getSupabase, isAuthConfigured } from "@/lib/supabase";

/** Callback rotasından gelen hata kodlarının okunabilir karşılıkları. */
const CALLBACK_ERRORS: Record<string, string> = {
  baglanti: "Doğrulama bağlantısı geçersiz görünüyor. Bağlantıyı tekrar iste.",
  dogrulama: "Bağlantının süresi dolmuş ya da daha önce kullanılmış. Yeni bir bağlantı iste.",
};

export default function GirisPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // `?hata=` parametresi useSearchParams yerine burada okunuyor: o hook
  // sayfayı Suspense sınırına zorluyor ve statik ön-render boş kalıyordu
  // (doğrudan /giris'e gelen kullanıcı bir an boş ekran görüyordu).
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("hata");
    if (code && CALLBACK_ERRORS[code]) setError(CALLBACK_ERRORS[code]);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) {
      setError("Giriş henüz yapılandırılmadı.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) {
      // Supabase mesajları İngilizce döner; en sık karşılaşılanı çeviriyoruz.
      setError(
        err.message.includes("Invalid login credentials")
          ? "E-posta veya şifre hatalı."
          : err.message.includes("Email not confirmed")
            ? "E-posta adresin henüz doğrulanmamış. Gelen kutunu kontrol et."
            : err.message,
      );
      return;
    }
    router.push("/chat");
    router.refresh();
  }

  return (
    <AuthShell
      title="Giriş yap"
      subtitle="Hesabına giriş yaparak profilini ve başvurularını her cihazdan kullan."
      footer={
        <>
          Hesabın yok mu?{" "}
          <a href="/kayit" style={{ color: "var(--terracotta-700)", fontWeight: 700 }}>
            Kayıt ol
          </a>
        </>
      }
    >
      {!isAuthConfigured && (
        <AuthNotice tone="info">
          Supabase anahtarları henüz tanımlı değil, bu yüzden giriş isteği gönderilemiyor.
          Ekranı önizleyebilirsin; anahtarlar <code>.env.local</code> dosyasına eklenince çalışacak.
        </AuthNotice>
      )}
      {error && <AuthNotice tone="error">{error}</AuthNotice>}

      <form onSubmit={onSubmit}>
        <label style={authLabelStyle} htmlFor="email">
          E-posta
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ornek@sirketin.com"
          style={{ ...authInputStyle, marginBottom: 18 }}
        />

        <label style={authLabelStyle} htmlFor="password">
          Şifre
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ ...authInputStyle, marginBottom: 10 }}
        />

        <div style={{ textAlign: "right", marginBottom: 18 }}>
          <a href="/sifre-sifirla" style={{ fontSize: 12.5, color: "var(--ink-600)", fontWeight: 600 }}>
            Şifremi unuttum
          </a>
        </div>

        <button type="submit" disabled={busy} style={authButtonStyle(busy)}>
          {busy ? "Giriş yapılıyor…" : "Giriş yap"}
        </button>
      </form>
    </AuthShell>
  );
}
