"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell, { AuthNotice, authButtonStyle, authInputStyle, authLabelStyle } from "@/components/AuthShell";
import { getSupabase, isAuthConfigured } from "@/lib/supabase";

const MIN_PASSWORD = 8;

/**
 * Tek sayfa, iki mod:
 * - Oturum yoksa → sıfırlama bağlantısı iste
 * - Oturum varsa (kullanıcı maildeki bağlantıyla /auth/callback üzerinden
 *   geldi) → yeni şifreyi belirle
 */
export default function SifreSifirlaPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"kontrol" | "istek" | "yeni-sifre">("kontrol");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setMode(data.session ? "yeni-sifre" : "istek");
    });
  }, []);

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/sifre-sifirla`,
    });
    setBusy(false);
    if (err) setError(err.message);
    else setSent(true);
  }

  async function setNewPassword(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/chat"), 1500);
  }

  if (done) {
    return (
      <AuthShell title="Şifren güncellendi" subtitle="Yönlendiriliyorsun…">
        <AuthNotice tone="info">Yeni şifren kaydedildi. Sohbet ekranına geçiliyorsun.</AuthNotice>
      </AuthShell>
    );
  }

  if (sent) {
    return (
      <AuthShell title="Bağlantı gönderildi" subtitle="Gelen kutunu kontrol et.">
        <AuthNotice tone="info">
          <strong>{email}</strong> adresine şifre sıfırlama bağlantısı gönderdik. Mail birkaç dakika
          içinde gelmezse spam klasörüne bak.
        </AuthNotice>
      </AuthShell>
    );
  }

  if (mode === "kontrol") return null;

  if (mode === "yeni-sifre") {
    return (
      <AuthShell title="Yeni şifreni belirle" subtitle="Bundan sonra bu şifreyle giriş yapacaksın.">
        {error && <AuthNotice tone="error">{error}</AuthNotice>}
        <form onSubmit={setNewPassword}>
          <label style={authLabelStyle} htmlFor="password">
            Yeni şifre
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
          <button type="submit" disabled={busy || password.length < MIN_PASSWORD} style={authButtonStyle(busy || password.length < MIN_PASSWORD)}>
            {busy ? "Kaydediliyor…" : "Şifreyi güncelle"}
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Şifreni mi unuttun?"
      subtitle="E-posta adresini yaz, sıfırlama bağlantısı gönderelim."
      footer={
        <a href="/giris" style={{ color: "var(--terracotta-700)", fontWeight: 700 }}>
          Girişe dön
        </a>
      }
    >
      {error && <AuthNotice tone="error">{error}</AuthNotice>}
      <form onSubmit={requestReset}>
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
        <button type="submit" disabled={busy} style={authButtonStyle(busy)}>
          {busy ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
        </button>
      </form>
    </AuthShell>
  );
}
