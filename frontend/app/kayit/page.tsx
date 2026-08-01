"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell, { AuthNotice, authButtonStyle, authInputStyle, authLabelStyle } from "@/components/AuthShell";
import { getSupabase, isAuthConfigured } from "@/lib/supabase";

const MIN_PASSWORD = 8;

export default function KayitPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [nextPath, setNextPath] = useState<string | null>(null);

  // `giris` sayfasındaki ile aynı desen: doğrudan bu sayfaya gelen kullanıcıyı
  // boş ekranla karşılamamak için useSearchParams yerine effect içinde okunur.
  useEffect(() => {
    const sonra = new URLSearchParams(window.location.search).get("sonra");
    if (sonra && sonra.startsWith("/")) setNextPath(sonra);
  }, []);

  const canSubmit = email.trim() !== "" && password.length >= MIN_PASSWORD && consent && !busy;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;

    setBusy(true);
    setError(null);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);

    if (err) {
      setError(
        err.message.includes("already registered")
          ? "Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene."
          : err.message,
      );
      return;
    }

    // E-posta doğrulaması açıksa oturum gelmez, kullanıcı maili beklemeli.
    // Kapalıysa oturum doğrudan açılır ve sohbete geçilir.
    if (data.session) {
      router.push(nextPath ?? "/chat");
      router.refresh();
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <AuthShell title="E-postanı doğrula" subtitle="Son bir adım kaldı.">
        <AuthNotice tone="info">
          <strong>{email}</strong> adresine bir doğrulama bağlantısı gönderdik. Bağlantıya tıkladığında
          hesabın aktifleşecek. Mail birkaç dakika içinde gelmezse spam klasörünü kontrol et.
        </AuthNotice>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Kayıt ol"
      subtitle="Profilini ve başvurularını kaydet, her cihazdan kaldığın yerden devam et."
      footer={
        <>
          Zaten hesabın var mı?{" "}
          <a href="/giris" style={{ color: "var(--terracotta-700)", fontWeight: 700 }}>
            Giriş yap
          </a>
        </>
      }
    >
      {!isAuthConfigured && (
        <AuthNotice tone="info">
          Supabase anahtarları henüz tanımlı değil, kayıt isteği gönderilemiyor. Ekranı önizleyebilirsin.
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
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ ...authInputStyle, marginBottom: 6 }}
        />
        <div style={{ fontSize: 12, color: "var(--ink-400)", marginBottom: 18 }}>
          En az {MIN_PASSWORD} karakter.
        </div>

        {/* KVKK: Aydınlatma Metni hesap açma senaryosunu kapsıyor, onayı
            burada almak gerekiyor (onboarding'deki onaydan ayrı). */}
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            fontSize: 13,
            color: "var(--ink-900)",
            lineHeight: 1.55,
            cursor: "pointer",
            marginBottom: 20,
          }}
        >
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            style={{ width: 18, height: 18, marginTop: 1, accentColor: "var(--terracotta-600)", flexShrink: 0 }}
          />
          <span>
            Kişisel verilerimin{" "}
            <a
              href="/legal/aydinlatma-metni"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{ color: "var(--terracotta-700)", textDecoration: "underline" }}
            >
              Aydınlatma Metni
            </a>{" "}
            kapsamında işlenmesini kabul ediyorum.
          </span>
        </label>

        <button type="submit" disabled={!canSubmit} style={authButtonStyle(!canSubmit)}>
          {busy ? "Hesap oluşturuluyor…" : "Hesap oluştur"}
        </button>
      </form>
    </AuthShell>
  );
}
