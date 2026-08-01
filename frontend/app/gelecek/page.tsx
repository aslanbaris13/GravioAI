"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Ms from "@/components/Ms";

/**
 * Yol haritası sayfası — ürünün nereye gittiğini anlatır.
 *
 * Bilerek backend'siz: hiçbir API çağrısı yok, içerik statik. Sayfadaki
 * sayılar da bu yüzden kurum adlarıyla veriliyor, program sayısıyla değil —
 * katalog büyüdükçe sayfanın yanlış bilgi göstermemesi için.
 *
 * Planlanan her madde "Yakında" rozetiyle işaretlidir; mevcut özelliklerle
 * karışmaması önemli (bkz. "Bugün neredeyiz" bölümü).
 */

/** Kategori taksonomisi backend'deki `models/taxonomy.py` ile birebir aynı.
 *  Bugün yalnızca ikisinde veri var; kalanlar için veri modeli hazır. */
const CATEGORIES: { name: string; desc: string; icon: string; live: boolean }[] = [
  {
    name: "Kamu Destekleri",
    desc: "KOSGEB, TÜBİTAK ve Kalkınma Ajansları hibe ve destek programları.",
    icon: "account_balance",
    live: true,
  },
  {
    name: "Yatırım Kaynakları",
    desc: "Girişim sermayesi fonları ve yatırım programları.",
    icon: "trending_up",
    live: true,
  },
  {
    name: "Bitirme Projesi Girişimleri",
    desc: "Bitirme projesinden doğan girişimlere sanayi destekli programlar.",
    icon: "school",
    live: false,
  },
  {
    name: "Yarışmalar ve Etkinlikler",
    desc: "Ödüllü yarışmalar, hackathon'lar ve girişimcilik etkinlikleri.",
    icon: "emoji_events",
    live: false,
  },
  {
    name: "Hızlandırıcı ve Kuluçka Merkezleri",
    desc: "Erken aşama girişimlere mentorluk ve sermaye sağlayan programlar.",
    icon: "rocket_launch",
    live: false,
  },
  {
    name: "Vergi ve Lokasyon Teşvikleri",
    desc: "Teknopark, Ar-Ge merkezi ve bölgesel vergi avantajları.",
    icon: "savings",
    live: false,
  },
];

const NEXT_CAPABILITIES: { title: string; desc: string; icon: string }[] = [
  {
    title: "Proaktif uygunluk bildirimi",
    desc: "Bugün bir koşulu karşılamıyorsan, karşıladığın gün haber verelim. Şirketin yaşı, ekip büyüklüğü ya da yeni bir çağrı açıldığında.",
    icon: "notifications_active",
  },
  {
    title: "Fırsat takvimi",
    desc: "Takip ettiğin programların son başvuru tarihleri tek bir takvimde; kaçırılan çağrı olmasın.",
    icon: "calendar_month",
  },
  {
    title: "Ekip ve danışman erişimi",
    desc: "Başvuru sürecini ekip arkadaşın veya danışmanınla birlikte yürütebilmek.",
    icon: "group",
  },
  {
    title: "Yatırımcı ve network eşleştirmesi",
    desc: "Profiline uygun melek yatırımcı, VC ve iş ortaklığı fırsatlarını, destek programlarıyla aynı motorla eşleştirelim.",
    icon: "handshake",
  },
  {
    title: "Etkinlik ve yarışma eşleştirmesi",
    desc: "TEKNOFEST, hackathon'lar, hızlandırıcı çağrıları — profiline uygun olanları proaktif olarak önerelim.",
    icon: "emoji_events",
  },
];

/** Hero'da sırayla görünen ifadeler. Kategoriler tek tek geçer, en sonda
 *  toparlayıcı ifade gelir ve döngü baştan başlar. */
const ROTATING_WORDS = [
  "yarışmalar",
  "hızlandırıcılar",
  "bitirme projesi girişimleri",
  "vergi teşvikleri",
  "Türkiye'nin fırsat evreni.",
];

const LAST_WORD = ROTATING_WORDS.length - 1;

function RotatingWord() {
  const [index, setIndex] = useState(0);
  const [reduced, setReduced] = useState(false);

  // Hareket hassasiyeti varsa hiç döndürme; doğrudan son ifadeyi göster.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduced(true);
      setIndex(LAST_WORD);
    }
  }, []);

  // Sürekli döngü. Son ifade cümlenin toparlayıcısı olduğu için ekranda
  // biraz daha uzun kalıyor.
  useEffect(() => {
    if (reduced) return;
    const dwell = index === LAST_WORD ? 3400 : 2200;
    const t = setTimeout(() => setIndex((i) => (i + 1) % ROTATING_WORDS.length), dwell);
    return () => clearTimeout(t);
  }, [index, reduced]);

  const isFinal = index === LAST_WORD;

  return (
    <span
      key={index}
      style={{
        display: "inline-block",
        // Son ifade cümlenin sonucu — vurgu rengi yerine ana metin rengine
        // dönüyor ki "yerine oturdu" hissi versin.
        color: isFinal ? "var(--ink-900)" : "var(--terracotta-600)",
        animation: "wordSwap .55s ease both",
      }}
    >
      {ROTATING_WORDS[index]}
    </span>
  );
}

/** Bir öğe ekrana girdiğinde `true` döner (bir kez, sonra gözlemi bırakır).
 *
 *  Sayfa açılışında değil, kaydırıldığında tetiklenmesi önemli: bu bölüm
 *  ilk ekranın altında kalıyor, animasyon kullanıcı oraya gelmeden biterse
 *  hiç görülmüyor.
 *
 *  IntersectionObserver desteklenmiyorsa içerik gizli kalmasın diye doğrudan
 *  görünür sayılır. */
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, inView };
}

type FilterKey = "all" | "live" | "soon";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Hepsi" },
  { key: "live", label: "Yayında" },
  { key: "soon", label: "Yakında" },
];

function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 44 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--terracotta-600)", letterSpacing: ".02em", marginBottom: 8 }}>
        {eyebrow}
      </div>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700, color: "var(--ink-900)", margin: "0 0 10px" }}>
        {title}
      </h2>
      {sub && (
        <p style={{ fontSize: 14.5, color: "var(--ink-600)", maxWidth: 560, margin: "0 auto", lineHeight: 1.6 }}>{sub}</p>
      )}
    </div>
  );
}

export default function GelecekPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");
  const { ref: todayRef, inView: todayInView } = useInView<HTMLDivElement>();
  const { ref: catRef, inView: catInView } = useInView<HTMLDivElement>();

  const visibleCategories = CATEGORIES.filter((c) =>
    filter === "all" ? true : filter === "live" ? c.live : !c.live,
  );

  return (
    <div style={{ background: "var(--paper-100)", minHeight: "100vh" }}>
      <div className="brand-strip" />

      {/* Ana sayfayla aynı koyu başlık şeridi */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 32px",
          background: "linear-gradient(165deg,var(--teal-900),var(--teal-800))",
          borderBottom: "1px solid rgba(255,255,255,.1)",
        }}
      >
        <button
          onClick={() => router.push("/")}
          aria-label="Ana sayfaya git"
          style={{ display: "flex", alignItems: "center", gap: 12, padding: 0 }}
        >
          <img src="/brand/gravio-mark.png" alt="" style={{ width: 38, height: "auto" }} />
          <span style={{ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 700, color: "#fff", letterSpacing: "-.02em" }}>
            GravioAI
          </span>
        </button>
        <button
          onClick={() => router.push("/onboarding")}
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
      </header>

      {/* ---------------- Vizyon ---------------- */}
      <section style={{ padding: "72px 32px 56px", textAlign: "center" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--terracotta-600)", letterSpacing: ".02em", marginBottom: 12 }}>
            Yol haritası
          </div>
          <h1
            style={{
              fontSize: "clamp(28px, 4.5vw, 42px)",
              fontWeight: 700,
              color: "var(--ink-900)",
              lineHeight: 1.22,
              letterSpacing: "-.02em",
              margin: "0 0 16px",
            }}
          >
            Bugün destek programları.
            <br />
            Yarın <RotatingWord />
          </h1>
          <p style={{ fontSize: 16, color: "var(--ink-600)", lineHeight: 1.65, margin: 0 }}>
            GravioAI bugün KOBİ&apos;ler ve girişimciler için hibe ve destek programlarını buluyor.
            Hedefimiz, bitirme projesinden doğan bir girişimden büyüyen şirkete kadar her ölçekte
            ekibin kendine uygun fırsatı tek bir yerden bulabilmesi.
          </p>
        </div>
      </section>

      {/* ---------------- Bugün neredeyiz ---------------- */}
      <section style={{ padding: "0 32px 72px" }}>
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            padding: "40px 44px",
            borderRadius: 20,
            background: "var(--surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--teal-700)", letterSpacing: ".02em", marginBottom: 26 }}>
            Bugün neredeyiz
          </div>
          {/* Hepsi aynı anda değil, sırayla belirir — akışın adım adım
              ilerlediğini hissettiriyor. */}
          <div ref={todayRef} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }} className="how-grid">
            {[
              { icon: "account_balance", t: "3 kurum", d: "KOSGEB, TÜBİTAK, Kalkınma Ajansları" },
              { icon: "manage_search", t: "Anlamsal eşleştirme", d: "Anahtar kelime değil, anlam tabanlı arama" },
              { icon: "fact_check", t: "Koşul koşul uygunluk", d: "Neyi karşılıyorsun, ne eksik" },
              { icon: "description", t: "Başvuru hazırlığı", d: "Evrak listesi ve iş planı taslağı" },
              { icon: "summarize", t: "Rapor yazımı", d: "Resmi başvuru raporu, bölüm bölüm otomatik yazılıyor" },
              { icon: "slideshow", t: "Sunum hazırlığı", d: "Yatırımcı/müşteri sunumu, profiline özel üretilip PPTX olarak iniyor" },
            ].map((x, i) => (
              <div
                key={x.t}
                style={{
                  opacity: todayInView ? undefined : 0,
                  animation: todayInView ? `viewIn .85s ease ${i * 0.32}s both` : undefined,
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 13,
                    background: "var(--terracotta-100)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Ms name={x.icon} size={26} color="var(--terracotta-700)" />
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ink-900)" }}>{x.t}</div>
                <div style={{ fontSize: 14, color: "var(--ink-600)", lineHeight: 1.6, marginTop: 6 }}>{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Kategori haritası ---------------- */}
      <section style={{ padding: "0 32px 72px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <SectionTitle
            eyebrow="Kapsam"
            title="Kapsamı adım adım genişletiyoruz"
            sub="Bugün iki kategori yayında. Veri modelimiz diğerleri için de hazır — her yeni kaynak, aynı eşleştirme ve uygunluk motoruyla çalışıyor."
          />

          {/* Filtre — statik listeyi gezilebilir hale getiriyor. */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28 }}>
            {FILTERS.map((f) => {
              const active = f.key === filter;
              const count =
                f.key === "all"
                  ? CATEGORIES.length
                  : CATEGORIES.filter((c) => (f.key === "live" ? c.live : !c.live)).length;
              return (
                <button
                  key={f.key}
                  className="roadmap-filter-btn"
                  onClick={() => setFilter(f.key)}
                  aria-pressed={active}
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    padding: "9px 18px",
                    borderRadius: 999,
                    border: `1px solid ${active ? "var(--terracotta-700)" : "var(--border-subtle)"}`,
                    background: active ? "var(--terracotta-100)" : "var(--surface)",
                    color: active ? "var(--terracotta-700)" : "var(--ink-600)",
                  }}
                >
                  {f.label}
                  <span style={{ marginLeft: 6, fontSize: 11.5, opacity: 0.75 }}>({count})</span>
                </button>
              );
            })}
          </div>

          {/* Kartlar dizideki sırayla belirir: önce yayında olanlar, sonra
              yakında olanlar. Dizi zaten bu sırada tutuluyor. */}
          <div ref={catRef} className="programs-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {visibleCategories.map((c, i) => (
              <div
                key={c.name}
                className={`roadmap-card ${c.live ? "roadmap-card-live" : "roadmap-card-soon"}`}
                style={{
                  padding: 22,
                  borderRadius: 16,
                  border: c.live ? "1px solid var(--teal-200)" : "1px dashed var(--border-subtle)",
                  background: c.live ? "var(--surface)" : "transparent",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  opacity: catInView ? (c.live ? 1 : 0.82) : 0,
                  animation: catInView ? `viewIn .8s ease ${i * 0.22}s both` : undefined,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <Ms name={c.icon} size={24} color={c.live ? "var(--teal-700)" : "var(--ink-400)"} />
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: 999,
                      whiteSpace: "nowrap",
                      background: c.live ? "var(--success-100)" : "var(--neutral-100)",
                      color: c.live ? "var(--success-700)" : "var(--neutral-600)",
                    }}
                  >
                    {c.live ? "Yayında" : "Yakında"}
                  </span>
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 15.5, fontWeight: 700, color: "var(--ink-900)", lineHeight: 1.35 }}>
                  {c.name}
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-600)", lineHeight: 1.55 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Bitirme projesi girişimleri (örnek) ---------------- */}
      <section style={{ padding: "0 32px 72px" }}>
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            padding: "34px 32px",
            borderRadius: 20,
            background: "linear-gradient(150deg,var(--terracotta-100),var(--sand-200))",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Ms name="school" size={24} color="var(--terracotta-700)" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--terracotta-700)", letterSpacing: ".03em" }}>
              YAKINDA · YENİ ALAN
            </span>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "var(--ink-900)", margin: "0 0 12px" }}>
            Bitirme projesinden doğan girişimler
          </h2>
          <p style={{ fontSize: 15, color: "var(--ink-900)", lineHeight: 1.7, margin: "0 0 16px", maxWidth: 720 }}>
            Sanayi kuruluşları bitirme projelerine konu, mentorluk ve bütçe desteği veriyor —
            örneğin TUSAŞ&apos;ın <strong>LIFT UP</strong> programı. Ama bu çağrılar tek tek şirket
            sitelerinde duyuruluyor; projeyi yürüten ekibin çoğu zaman haberi olmuyor.
          </p>
          <p style={{ fontSize: 14.5, color: "var(--ink-600)", lineHeight: 1.65, margin: 0, maxWidth: 720 }}>
            Aynı eşleştirme motoru burada da çalışıyor: ekip projesini anlatıyor, sistem uygun
            çağrıları ve başvuru şartlarını çıkarıyor. Bize göre bu, ürünün en doğal genişleme
            yönü — bir bitirme projesi çoğu zaman ilk girişimin kendisi, değişen tek şey veri kaynağı.
          </p>
        </div>
      </section>

      {/* ---------------- Yeni yetenekler ---------------- */}
      <section style={{ padding: "0 32px 72px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <SectionTitle
            eyebrow="Yakında"
            title="Kapsam dışında neler geliyor"
            sub="Hedefimiz yalnızca destek programı bulmak değil — şirketleri yatırımcıyla, etkinlikle ve doğru insanlarla buluşturan bir büyüme ortağı olmak."
          />
          <div className="how-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
            {NEXT_CAPABILITIES.map((x) => (
              <div
                key={x.title}
                style={{
                  padding: 22,
                  borderRadius: 16,
                  background: "var(--surface)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <Ms name={x.icon} size={24} color="var(--terracotta-700)" />
                <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: "var(--ink-900)", margin: "10px 0 6px" }}>
                  {x.title}
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-600)", lineHeight: 1.6 }}>{x.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Kapanış ---------------- */}
      <section style={{ padding: "64px 32px", background: "linear-gradient(165deg,var(--teal-900),var(--teal-800))", textAlign: "center" }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "#fff", margin: "0 0 12px" }}>
            Bugün çalışan kısmıyla başla
          </h2>
          <p style={{ fontSize: 14.5, color: "var(--on-dark-muted)", lineHeight: 1.65, margin: "0 0 24px" }}>
            Yol haritasındakiler henüz yayında değil. Ama kamu destekleri bugün çalışıyor —
            işletmeni anlat, sana uygun programları hemen gör.
          </p>
          <button
            onClick={() => router.push("/giris")}
            style={{
              padding: "15px 36px",
              borderRadius: 12,
              background: "var(--terracotta-600)",
              color: "#fff",
              fontSize: 15.5,
              fontWeight: 700,
              boxShadow: "var(--shadow-cta)",
            }}
          >
            Ücretsiz başla
          </button>
        </div>
      </section>

      <footer style={{ padding: "28px 32px", textAlign: "center", fontSize: 12, color: "var(--ink-400)", background: "var(--paper-50)" }}>
        © {new Date().getFullYear()} GravioAI — Türkiye girişim ve KOBİ destek platformu
      </footer>
    </div>
  );
}
