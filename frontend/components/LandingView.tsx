"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Ms from "./Ms";
import ChatWidget from "./ChatWidget";
import { getPrograms } from "@/lib/api";
import type { BackendSupportProgram } from "@/lib/api";
import { formatAmount } from "@/lib/adapter";
import { useAppState } from "@/lib/AppStateContext";

const HERO_SLIDES = [
  {
    eyebrow: "GravioAI ile",
    title: "KOBİ'ler için hibe ve destek bulmanın en hızlı yolu",
    desc: "Sektörünü, konumunu ve hedeflerini anlat — sana uygun devlet ve özel sektör desteklerini saniyeler içinde sıralayalım.",
    cta: "Ücretsiz başla",
    target: "/onboarding",
    image: "/hero/slide-1.webp",
  },
  {
    eyebrow: "Yapay zekâ destekli eşleştirme",
    title: "Yüzlerce destek programını tek ekranda tarayın",
    desc: "KOSGEB, TÜBİTAK, İŞKUR ve daha fazlası — uygunluk şartlarını otomatik kontrol ederek zaman kaybetmeden en uygun programı bulun.",
    cta: "Programları gör",
    target: "#programlar",
    image: "/hero/slide-2.webp",
  },
  {
    eyebrow: "Başvuru asistanı",
    title: "Başvuru belgelerini otomatik hazırlayın",
    desc: "Profiline özel başvuru taslağı, gerekli evrak listesi ve sunum dosyasını GravioAI senin için oluştursun.",
    cta: "Nasıl çalıştığını gör",
    target: "#nasil-calisir",
    image: "/hero/slide-3.webp",
  },
];

const PARTNERS = [
  "KOSGEB",
  "TÜBİTAK",
  "İŞKUR",
  "Ticaret Bakanlığı",
  "Sanayi ve Teknoloji Bakanlığı",
  "Kalkınma Ajansları",
  "Teknoparklar",
  "Turizm Tanıtım Ajansı",
];

/** Ana sayfada gösterilecek program kartı sayısı (3'lü grid'de iki sıra). */
const PROGRAM_PREVIEW_COUNT = 6;

/**
 * `support_rate` serbest metindir: "%80", "%60 - %100" ya da
 * "Destek oranı belirtilmemiş" gelebilir. Metinde yüzde yoksa `null` döner —
 * kartta uydurma bir oran/çubuk göstermemek için o satır hiç çizilmez.
 * Aralık verilmişse çubuk üst sınıra göre dolar, etikette metnin kendisi kalır.
 */
function parseSupportRate(raw?: string | null): { label: string; pct: number } | null {
  if (!raw) return null;
  const found = [...raw.matchAll(/%\s*(\d{1,3})/g)]
    .map((m) => Number(m[1]))
    .filter((n) => n > 0 && n <= 100);
  if (found.length === 0) return null;
  return { label: raw.trim(), pct: Math.max(...found) };
}

/** Kart için kısa destek tutarı ("20 M ₺") — tutar yoksa null. Oran
 *  bulunamayan programlarda oranın yerine bu gösterilir. */
function formatCardAmount(p: BackendSupportProgram): string | null {
  const { hasAmount, amountText, curCode } = formatAmount(p.amount_min, p.amount_max, p.currency);
  if (!hasAmount) return null;
  const sym = curCode === "USD" ? " $" : curCode === "EUR" ? " €" : curCode === "TRY" ? " ₺" : "";
  return `${amountText}${sym}`;
}

/**
 * Kamu/özel destek kurumlarının marka içerikleri yeniden üretilmeden,
 * sade metin rozetleriyle temsil ediliyor (logo taklidi yok — IP riski
 * yaratmadan "bu kurumları kapsıyoruz" mesajı veriliyor).
 */
function PartnerMarquee() {
  const items = [...PARTNERS, ...PARTNERS];
  return (
    <div style={{ overflow: "hidden", padding: "22px 0", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)", background: "var(--paper-50)" }}>
      <div style={{ display: "flex", gap: 14, width: "max-content", animation: "marqueeScroll 26s linear infinite" }}>
        {items.map((p, i) => {
          const accent = i % 2 === 0 ? "var(--teal-700)" : "var(--terracotta-600)";
          return (
            <span
              key={`${p}-${i}`}
              style={{
                flexShrink: 0,
                padding: "9px 20px",
                borderRadius: 999,
                border: `1.5px solid ${accent}`,
                background: "var(--paper-100)",
                fontSize: 13,
                fontWeight: 700,
                color: accent,
                letterSpacing: ".01em",
              }}
            >
              {p}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function HeroCarousel({ onCta }: { onCta: (target: string) => void }) {
  const [index, setIndex] = useState(0);
  // Otomatik geçiş, üzerine gelince/odaklanınca durur: buton etiketi her
  // slaytta değiştiği için kullanıcı butona uzanırken hedef kaymamalı.
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % HERO_SLIDES.length), 6000);
    return () => clearInterval(id);
  }, [paused]);

  const slide = HERO_SLIDES[index];
  const goPrev = () => setIndex((i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  const goNext = () => setIndex((i) => (i + 1) % HERO_SLIDES.length);

  return (
    <section
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      style={{ background: "var(--paper-100)", padding: "40px 32px 20px", position: "relative", overflow: "hidden" }}
    >
      {/* Yumuşak renkli parıltılar — bej zemini kırıyor */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -120,
          left: "8%",
          width: 360,
          height: 360,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(27,107,114,.16), transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: -140,
          right: "6%",
          width: 380,
          height: 380,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,106,70,.16), transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center", position: "relative" }}>
        <div
          style={{
            position: "relative",
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 18px 40px rgba(22,48,46,.18)",
          }}
        >
          <img
            key={slide.image}
            src={slide.image}
            alt={slide.title}
            width={1600}
            height={893}
            fetchPriority="high"
            style={{ width: "100%", height: "auto", display: "block", animation: "heroFadeIn .5s ease forwards" }}
          />

          {/* İleri/geri okları — noktalar fark edilmeyebiliyordu, sonraki/önceki
              slayta geçiş burada daha belirgin bir kontrolle de yapılabiliyor. */}
          <button
            onClick={goPrev}
            aria-label="Önceki slayt"
            className="hero-nav-btn"
            style={{
              position: "absolute",
              top: "50%",
              left: 14,
              transform: "translateY(-50%)",
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "rgba(255,255,255,.88)",
              boxShadow: "0 4px 14px rgba(22,48,46,.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ms name="chevron_left" size={22} color="var(--ink-900)" />
          </button>
          <button
            onClick={goNext}
            aria-label="Sonraki slayt"
            className="hero-nav-btn"
            style={{
              position: "absolute",
              top: "50%",
              right: 14,
              transform: "translateY(-50%)",
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "rgba(255,255,255,.88)",
              boxShadow: "0 4px 14px rgba(22,48,46,.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ms name="chevron_right" size={22} color="var(--ink-900)" />
          </button>
        </div>

        <button
          onClick={() => onCta(slide.target)}
          style={{
            marginTop: 28,
            padding: "15px 36px",
            borderRadius: 12,
            border: "none",
            background: "var(--teal-700)",
            color: "#fff",
            fontSize: 15.5,
            fontWeight: 700,
            boxShadow: "0 8px 20px rgba(27,107,114,.28)",
          }}
        >
          {slide.cta}
        </button>
      </div>

      {/* Noktalar */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`${i + 1}. slayt`}
            style={{
              width: i === index ? 22 : 8,
              height: 8,
              borderRadius: 999,
              background: i === index ? "var(--terracotta-600)" : "var(--border-subtle)",
              transition: "all .25s",
            }}
          />
        ))}
      </div>
    </section>
  );
}

/** Veri gelene kadar aynı yükseklikte iskelet kartlar — grid zıplamasın. */
function ProgramCardSkeleton() {
  return (
    <div
      aria-hidden
      style={{
        padding: 22,
        borderRadius: 16,
        border: "1px solid var(--border-subtle)",
        background: "var(--paper-50)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minHeight: 208,
      }}
    >
      <div style={{ height: 12, width: "35%", borderRadius: 999, background: "var(--sand-200)" }} />
      <div style={{ height: 18, width: "90%", borderRadius: 6, background: "var(--sand-200)" }} />
      <div style={{ height: 12, width: "100%", borderRadius: 999, background: "var(--sand-200)" }} />
      <div style={{ height: 12, width: "70%", borderRadius: 999, background: "var(--sand-200)" }} />
      <div style={{ flex: 1 }} />
      <div style={{ height: 6, borderRadius: 999, background: "var(--sand-200)" }} />
    </div>
  );
}

/**
 * Ana sayfadaki program vitrini. Kartlar artık sabit örnek veriden değil,
 * gerçek program kataloğundan (`GET /programs`) geliyor ve her kart kendi
 * detay sayfasına (`/program/{program_id}`) gidiyor.
 */
function ProgramsGrid() {
  const router = useRouter();
  const [programs, setPrograms] = useState<BackendSupportProgram[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPrograms()
      .then((list) => {
        if (!cancelled) setPrograms(list);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const shown = programs?.slice(0, PROGRAM_PREVIEW_COUNT) ?? [];

  return (
    <section id="programlar" style={{ padding: "72px 32px", background: "var(--paper-100)" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--terracotta-600)", letterSpacing: ".02em", marginBottom: 8 }}>
            Öne çıkan programlar
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700, color: "var(--ink-900)", margin: "0 0 10px" }}>
            Sana uygun desteği burada bul
          </h2>
          <p style={{ fontSize: 14.5, color: "var(--ink-600)", maxWidth: 520, margin: "0 auto" }}>
            Kataloğumuzdaki gerçek destek programlarından bazıları — karta tıklayıp
            tüm şartları gör, sana özel eşleşme için profilini oluştur.
          </p>
        </div>

        {failed ? (
          <div
            style={{
              textAlign: "center",
              padding: "34px 24px",
              borderRadius: 16,
              border: "1px solid var(--border-subtle)",
              background: "var(--paper-50)",
              color: "var(--ink-600)",
              fontSize: 14,
            }}
          >
            <Ms name="cloud_off" size={28} color="var(--ink-400)" />
            <div style={{ marginTop: 10 }}>
              Program listesine şu an ulaşılamıyor. Birazdan tekrar dene ya da
              hemen profilini oluşturup eşleşmelerini gör.
            </div>
          </div>
        ) : (
          <div className="programs-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {programs === null
              ? Array.from({ length: PROGRAM_PREVIEW_COUNT }, (_, i) => <ProgramCardSkeleton key={i} />)
              : shown.map((p) => {
                  const rate = parseSupportRate(p.support_rate);
                  const amount = formatCardAmount(p);
                  return (
                    <button
                      key={p.program_id}
                      onClick={() => router.push(`/program/${encodeURIComponent(p.program_id)}`)}
                      style={{
                        textAlign: "left",
                        padding: 22,
                        borderRadius: 16,
                        border: "1px solid var(--border-subtle)",
                        background: "var(--paper-50)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        minHeight: 208,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--teal-700)", letterSpacing: ".01em" }}>
                          {p.source ?? "—"}
                        </span>
                        {p.support_type && (
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              color: "var(--terracotta-700)",
                              background: "var(--terracotta-100)",
                              borderRadius: 999,
                              padding: "3px 9px",
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}
                          >
                            {p.support_type}
                          </span>
                        )}
                      </div>

                      <div style={{ fontFamily: "var(--font-display)", fontSize: 16.5, fontWeight: 700, color: "var(--ink-900)", lineHeight: 1.35 }}>
                        {p.title}
                      </div>
                      <div className="program-card-desc" style={{ fontSize: 13, color: "var(--ink-600)", lineHeight: 1.55, flex: 1 }}>
                        {p.conditions_summary}
                      </div>

                      {/* Alt bilgi satırı üç kademeli: yüzde varsa oran çubuğu,
                          yoksa destek tutarı, o da yoksa kapsam. Kaynak veride
                          25 programın yalnızca 9'unda yüzde var — uydurma bir
                          oran üretmek yerine elimizdeki gerçek bilgiyi
                          gösteriyoruz, böylece kartlar da boş kalmıyor. */}
                      {rate ? (
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, gap: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-400)" }}>Destek oranı</span>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, fontWeight: 600, color: "var(--terracotta-600)" }}>
                              {rate.label}
                            </span>
                          </div>
                          <div style={{ height: 6, borderRadius: 999, background: "var(--border-subtle)", overflow: "hidden" }}>
                            <div
                              style={{
                                height: "100%",
                                width: `${rate.pct}%`,
                                borderRadius: 999,
                                background: "linear-gradient(90deg,var(--teal-500),var(--terracotta-600))",
                              }}
                            />
                          </div>
                        </div>
                      ) : amount ? (
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-400)" }}>Destek tutarı</span>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, fontWeight: 600, color: "var(--terracotta-600)" }}>
                            {amount}
                          </span>
                        </div>
                      ) : p.region ? (
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, minWidth: 0 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-400)", flexShrink: 0 }}>Kapsam</span>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "var(--ink-600)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {p.region}
                          </span>
                        </div>
                      ) : null}

                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 700, color: "var(--teal-700)", marginTop: 2 }}>
                        Detayı gör <Ms name="arrow_forward" size={14} color="var(--teal-700)" />
                      </div>
                    </button>
                  );
                })}
          </div>
        )}

        <div style={{ textAlign: "center", fontSize: 11.5, color: "var(--ink-400)", marginTop: 28 }}>
          Şartlar ve tutarlar programın resmî kaynağından alınır; başvuru öncesi
          program detayındaki güncel bilgiyi doğrula.
        </div>
      </div>
    </section>
  );
}

export default function LandingView() {
  const router = useRouter();
  const { userEmail } = useAppState();
  // Kullanıcı adı = e-postanın @ öncesi kısmı.
  const userName = userEmail ? userEmail.split("@")[0] : "";
  const goOnboarding = () => router.push("/onboarding");

  return (
    <div style={{ background: "var(--paper-100)", minHeight: "100vh" }}>
      {/* İnce marka şeridi — bej ağırlıklı sayfada ilk renk teması */}
      <div style={{ height: 4, background: "linear-gradient(90deg,var(--teal-700),var(--terracotta-600))" }} />
      {/* ---------------- Üst menü ---------------- */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 32px",
          // Sayfanın altındaki "Üç adımda fırsatını bul" bandıyla birebir aynı
          // koyu teal — üst ve alt aynı renkle çerçeveleniyor. Koyu zemin
          // olduğu için içerideki metinler on-dark tonlarına çevrildi.
          background: "linear-gradient(165deg,var(--teal-900),var(--teal-800))",
          borderBottom: "1px solid rgba(255,255,255,.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/brand/gravio-mark.png" alt="GravioAI" style={{ width: 42, height: "auto" }} />
          <span style={{ fontFamily: "var(--font-display)", fontSize: 23, fontWeight: 700, color: "#fff", letterSpacing: "-.02em" }}>
            GravioAI
          </span>
        </div>

        <nav className="landing-nav-links" style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <a href="#programlar" style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", borderBottom: "2px solid var(--terracotta-600)", paddingBottom: 2 }}>Programlar</a>
          <a href="#nasil-calisir" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--on-dark-muted)" }}>Nasıl çalışır</a>
          <a href="/gelecek" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--on-dark-muted)" }}>Yol Haritası</a>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Ana sayfa da oturum durumunu yansıtır: girişliyken "Giriş yap"
              göstermek, kullanıcıya çıkış yapmış gibi hissettiriyordu. */}
          {userEmail ? (
            <button
              onClick={() => router.push("/panel")}
              title={userEmail}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13.5,
                fontWeight: 700,
                color: "#fff",
                padding: "8px 14px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,.22)",
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "var(--teal-700)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {userName.slice(0, 1).toUpperCase()}
              </span>
              {userName}
            </button>
          ) : (
            <button
              onClick={() => router.push("/giris")}
              style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", padding: "10px 16px" }}
            >
              Giriş yap
            </button>
          )}
          {/* Girişli kullanıcı zaten hesabına dönebiliyor (soldaki avatar
              düğmesi) — "Başla" yeniden onboarding'e sürükleyip gereksiz
              tekrar hissi veriyordu. */}
          {!userEmail && (
            <button
              onClick={goOnboarding}
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: "#fff",
                padding: "11px 20px",
                borderRadius: 10,
                background: "var(--terracotta-600)",
              }}
            >
              Başla
            </button>
          )}
        </div>
      </header>

      {/* Her slaytın butonu artık kendi hedefine gidiyor — önceden üçü de
          onboarding'e gidiyordu, "Programları gör" yazan buton bile. */}
      <HeroCarousel
        onCta={(target) => {
          if (target.startsWith("#")) {
            document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
          } else {
            router.push(target);
          }
        }}
      />
      <PartnerMarquee />
      <ProgramsGrid />

      {/* ---------------- Nasıl çalışır ---------------- */}
      <section id="nasil-calisir" style={{ padding: "72px 32px", background: "linear-gradient(165deg,var(--teal-900),var(--teal-800))" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, color: "#fff", margin: "0 0 40px" }}>
            Üç adımda fırsatını bul
          </h2>
          <div className="how-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, textAlign: "left" }}>
            {[
              { icon: "chat_bubble", title: "İşletmeni anlat", desc: "Sohbet ya da hızlı formla sektör, konum ve hedeflerini paylaş." },
              { icon: "manage_search", title: "Eşleşmeleri gör", desc: "Sana uygun devlet ve özel sektör programları sıralanır." },
              { icon: "description", title: "Başvuruyu hazırla", desc: "GravioAI, taslak belgeleri ve gerekli evrak listesini senin için çıkarır." },
            ].map((s, i) => (
              <div key={s.title} style={{ background: "rgba(255,255,255,.06)", borderRadius: 16, padding: 22, border: "1px solid rgba(255,255,255,.12)" }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 11,
                    background: i % 2 === 0 ? "var(--terracotta-600)" : "var(--teal-500)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Ms name={s.icon} size={20} color="#fff" />
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.7)", lineHeight: 1.55 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{ padding: "28px 32px", textAlign: "center", fontSize: 12, color: "var(--ink-400)", background: "var(--paper-50)" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 18, marginBottom: 10, flexWrap: "wrap" }}>
          <a href="/legal/aydinlatma-metni" style={{ color: "var(--ink-600)", fontWeight: 600 }}>Aydınlatma Metni</a>
          <a href="/legal/kvkk-riza" style={{ color: "var(--ink-600)", fontWeight: 600 }}>Açık Rıza Metni</a>
        </div>
        © {new Date().getFullYear()} GravioAI — Türkiye girişim ve KOBİ destek platformu
      </footer>

      <ChatWidget />
    </div>
  );
}