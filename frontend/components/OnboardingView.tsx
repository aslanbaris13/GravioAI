/**
 * İlk kullanım onboarding akışı — split layout.
 *
 * Solda markalı ilerleme paneli (sidebar ile aynı lacivert gradyan),
 * sağda büyük adım içeriği. Sohbetin aksine yapılandırılmış sorularla
 * ilerler — hiçbir adımı LLM çağrısı gerektirmez, tamamen istemci
 * tarafında çalışır. Son adımda topladığı verilerden doğrudan bir
 * BackendUserProfile üretir; "İşletmeni anlat" adımındaki serbest metin
 * profile.summary'ye yazılır (RAG eşleştirmesinin embed'lediği alan).
 */
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Ms from "./Ms";
import { ApiError, parseProfileDocument } from "@/lib/api";
import type { BackendUserProfile } from "@/lib/api";

const SECTORS = [
  { key: "Yazılım / Teknoloji", icon: "computer" },
  { key: "İmalat / Üretim", icon: "precision_manufacturing" },
  { key: "Ticaret / Perakende", icon: "storefront" },
  { key: "Tarım / Gıda", icon: "agriculture" },
  { key: "Turizm / Hizmet", icon: "hotel" },
  { key: "Sağlık / Biyoteknoloji", icon: "biotech" },
  { key: "Enerji / Çevre", icon: "bolt" },
  { key: "Diğer", icon: "category" },
];

const GOALS = [
  "Ar-Ge / Yenilik hibesi",
  "Yatırım veya hızlandırıcı",
  "Bulut altyapısı kredisi",
  "İstihdam desteği",
  "Vergi teşviki",
  "İhracat desteği",
  "Kadın girişimci destekleri",
  "Eğitim / danışmanlık",
];

type StepKey = "welcome" | "sector" | "location" | "team" | "goals" | "about" | "consent";

const STEPS: StepKey[] = ["welcome", "sector", "location", "team", "goals", "about", "consent"];

/** Sol paneldeki adım listesi — welcome hariç gerçek adımlar. */
const STEP_LABELS: { key: StepKey; label: string; icon: string }[] = [
  { key: "sector", label: "Sektörün", icon: "domain" },
  { key: "location", label: "Konum ve şirket", icon: "location_on" },
  { key: "team", label: "Ekibin", icon: "group" },
  { key: "goals", label: "Hedeflerin", icon: "flag" },
  { key: "about", label: "İşletmeni anlat", icon: "edit_note" },
  { key: "consent", label: "Onay", icon: "verified_user" },
];

interface FormState {
  companyName: string;
  website: string;
  sector: string | null;
  city: string;
  companyExists: boolean | null;
  companyAgeYears: string;
  teamSize: string;
  womenEntrepreneur: boolean;
  student: boolean;
  inTechnopark: boolean;
  goals: string[];
  about: string;
  consent: boolean;
}

const EMPTY_FORM: FormState = {
  companyName: "",
  website: "",
  sector: null,
  city: "",
  companyExists: null,
  companyAgeYears: "",
  teamSize: "",
  womenEntrepreneur: false,
  student: false,
  inTechnopark: false,
  goals: [],
  about: "",
  consent: false,
};

function buildProfile(f: FormState): BackendUserProfile {
  // Kullanıcı kendi cümleleriyle anlattıysa onu kullan (eşleştirme için en
  // zengin sinyal); yazmadıysa yapılandırılmış alanlardan bir özet kur.
  const parts: string[] = [];
  if (f.sector) parts.push(f.sector);
  if (f.city) parts.push(f.city);
  if (f.teamSize) parts.push(`${f.teamSize} kişilik ekip`);
  if (f.goals.length > 0) parts.push(f.goals.join(", ") + " arıyor");
  const composed = parts.length > 0 ? parts.join(" — ") : null;
  const summary = f.about.trim() || composed;

  return {
    company_name: f.companyName.trim() || null,
    website: f.website.trim() || null,
    sector: f.sector || null,
    city: f.city.trim() || null,
    team_size: f.teamSize ? Number(f.teamSize) : null,
    company_exists: f.companyExists,
    company_age_years: f.companyAgeYears ? Number(f.companyAgeYears) : null,
    women_entrepreneur: f.womenEntrepreneur || null,
    student: f.student || null,
    in_technopark: f.inTechnopark || null,
    goals: f.goals,
    summary,
  };
}

/** Yüklenen bir CV/şirket dokümanından çıkarılan alanları forma uygular.
 * Zaten doldurulmuş alanlar korunur, yalnızca boş olanlar dosyadan gelenle doldurulur —
 * kullanıcının elle girdiği bilgiler üzerine yazılmaz. */
function applyParsedProfile(f: FormState, p: BackendUserProfile): FormState {
  return {
    ...f,
    companyName: f.companyName || p.company_name || "",
    website: f.website || p.website || "",
    sector: f.sector ?? p.sector ?? null,
    city: f.city || p.city || "",
    companyExists: f.companyExists ?? p.company_exists ?? null,
    companyAgeYears: f.companyAgeYears || (p.company_age_years != null ? String(p.company_age_years) : ""),
    teamSize: f.teamSize || (p.team_size != null ? String(p.team_size) : ""),
    womenEntrepreneur: f.womenEntrepreneur || Boolean(p.women_entrepreneur),
    student: f.student || Boolean(p.student),
    inTechnopark: f.inTechnopark || Boolean(p.in_technopark),
    goals: f.goals.length > 0 ? f.goals : p.goals ?? [],
    about: f.about || p.summary || "",
  };
}

/* ------------------------------------------------------------------ */
/* Ortak küçük stiller                                                  */
/* ------------------------------------------------------------------ */

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 16px",
  borderRadius: 12,
  border: "1.5px solid var(--border-subtle)",
  fontSize: 15,
  color: "var(--ink-900)",
  background: "var(--surface-strong)",
};

const labelStyle: React.CSSProperties = {
  fontSize: 13.5,
  fontWeight: 600,
  color: "var(--ink-600)",
  display: "block",
  marginBottom: 8,
};

function StepHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--ink-900)", margin: "0 0 6px", letterSpacing: "-.01em" }}>
        {title}
      </h2>
      <p style={{ fontSize: 14.5, color: "var(--ink-400)", margin: 0 }}>{sub}</p>
    </div>
  );
}

export default function OnboardingView({
  onComplete,
  onSkip,
}: {
  onComplete: (profile: BackendUserProfile) => void;
  onSkip: () => void;
}) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [docUpload, setDocUpload] = useState<{ status: "idle" | "loading" | "success" | "error"; message?: string }>({
    status: "idle",
  });
  const step = STEPS[stepIndex];

  async function handleDocumentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // aynı dosyayı tekrar seçebilmek için input'u sıfırla
    if (!file) return;

    setDocUpload({ status: "loading" });
    try {
      const parsed = await parseProfileDocument(file);
      setForm((f) => applyParsedProfile(f, parsed));
      const detected = [
        parsed.sector && `Sektör: ${parsed.sector}`,
        parsed.city && `Şehir: ${parsed.city}`,
        parsed.team_size != null && `Ekip: ${parsed.team_size} kişi`,
      ].filter(Boolean);
      setDocUpload({
        status: "success",
        message:
          detected.length > 0
            ? `${detected.join(" · ")} tespit edildi.`
            : "Belge okundu ve aşağıdaki metne eklendi.",
      });
    } catch (err) {
      setDocUpload({
        status: "error",
        message: err instanceof ApiError ? err.message : "Belge okunamadı, elle yazmayı deneyebilirsin.",
      });
    }
  }

  const isLast = stepIndex === STEPS.length - 1;
  const isFirst = stepIndex === 0;

  function next() {
    if (isLast) {
      onComplete(buildProfile(form));
      return;
    }
    setStepIndex((i) => i + 1);
  }

  function back() {
    if (!isFirst) setStepIndex((i) => i - 1);
  }

  function toggleGoal(g: string) {
    setForm((f) => ({
      ...f,
      goals: f.goals.includes(g) ? f.goals.filter((x) => x !== g) : [...f.goals, g],
    }));
  }

  const canProceed = step !== "consent" || form.consent;

  return (
    <section style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--paper-100)" }}>
      {/* Ana sayfadaki marka şeridi — onboarding de aynı işaretle açılır. */}
      <div className="brand-strip" />
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
      {/* ---------------- Sol panel — marka + ilerleme ---------------- */}
      <aside
        className="onboarding-aside"
        style={{
          width: 380,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(177deg,var(--teal-800) 0%,var(--teal-900) 100%)",
          color: "var(--on-dark)",
          padding: "34px 30px",
        }}
      >
        {/* Sidebar'daki logoyla aynı davranış: ana sayfaya döner. Onboarding'de
            sidebar olmadığı için tek çıkış noktası bu. */}
        <button
          onClick={() => router.push("/")}
          aria-label="Ana sayfaya git"
          title="Ana sayfa"
          style={{ display: "flex", alignItems: "center", gap: 12, padding: 0, textAlign: "left" }}
        >
          <img src="/brand/gravio-mark.png" alt="" style={{ width: 40, height: "auto", flexShrink: 0 }} />
          <div style={{ lineHeight: 1.05 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 700, color: "#fff", letterSpacing: "-.02em" }}>
              GravioAI
            </div>
            <div style={{ fontSize: 11, color: "var(--on-dark-faint)", fontWeight: 500, marginTop: 2 }}>Fırsat asistanı</div>
          </div>
        </button>

        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", lineHeight: 1.3, letterSpacing: "-.01em", margin: "44px 0 10px" }}>
          Yüzeyin altındaki fırsatı çıkaralım.
        </h1>
        <p style={{ fontSize: 13.5, color: "var(--on-dark-muted)", lineHeight: 1.6, margin: "0 0 36px" }}>
          Birkaç soruyla işletmeni tanıyalım — sana uygun devlet ve özel sektör
          desteklerini bulalım, uygunluğunu kontrol edip başvurunu hazırlayalım.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {STEP_LABELS.map((s) => {
            const idx = STEPS.indexOf(s.key);
            const done = stepIndex > idx;
            const active = stepIndex === idx;
            return (
              <div
                key={s.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 11,
                  background: active ? "rgba(255,255,255,.09)" : "transparent",
                  boxShadow: active ? "inset 3px 0 0 var(--terracotta-600)" : "none",
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: done ? "linear-gradient(140deg,var(--terracotta-600),var(--terracotta-700))" : active ? "rgba(201,106,70,.18)" : "rgba(255,255,255,.06)",
                    border: active ? "1.5px solid var(--terracotta-600)" : "1.5px solid transparent",
                  }}
                >
                  {done ? (
                    <Ms name="check" size={16} color="#fff" />
                  ) : (
                    <Ms name={s.icon} size={15} color={active ? "var(--terracotta-400)" : "var(--on-dark-faint)"} />
                  )}
                </div>
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: done ? "var(--on-dark)" : active ? "#fff" : "var(--on-dark-faint)",
                  }}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        <div
          style={{
            padding: 13,
            borderRadius: 13,
            background: "rgba(255,255,255,.05)",
            border: "1px solid rgba(255,255,255,.07)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
            <Ms name="verified_user" size={17} color="var(--terracotta-400)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--on-dark)" }}>Verilerin güvende</span>
          </div>
          <div style={{ fontSize: 11.5, lineHeight: 1.55, color: "var(--on-dark-muted)" }}>
            Verdiğin bilgiler yalnızca sana uygun destekleri bulmak için kullanılır,
            şifreli saklanır ve dilediğin zaman silebilirsin.
          </div>
        </div>
      </aside>

      {/* ---------------- Sağ panel — adım içeriği ---------------- */}
      {/* `display:flex` + çocukta `margin:auto`: içerik geniş ekranlarda
          hem yatayda hem dikeyde ortalanır (üstte kalıp altında/sağında
          büyük boşluk bırakmaz), içerik viewport'tan uzun olduğunda ise
          (ör. Hedeflerin adımı) `justify-content:center` gibi kırpma
          yapmadan tam kaydırılabilir kalır. */}
      <main
        className="onboarding-main"
        style={{ flex: 1, minWidth: 0, overflowY: "auto", display: "flex", padding: "48px 56px 80px" }}
      >
        <div style={{ maxWidth: 620, width: "100%", margin: "auto" }}>
          {/* Mobil ilerleme çubuğu (masaüstünde gizli) */}
          {!isFirst && (
            <div className="onboarding-mobile-progress" style={{ gap: 6, marginBottom: 26 }}>
              {STEP_LABELS.map((s) => {
                const idx = STEPS.indexOf(s.key);
                return (
                  <div
                    key={s.key}
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 999,
                      background: stepIndex >= idx ? "var(--terracotta-600)" : "var(--border-subtle)",
                      transition: "background .25s",
                    }}
                  />
                );
              })}
            </div>
          )}

          <div key={step} style={{ animation: "viewIn .3s ease" }}>
            {step === "welcome" && (
              <div style={{ paddingTop: 24 }}>
                {/* Roket işareti yerine "GravioAI" kelime markası. Görsel
                    736x142 (oran ~5.2) — genişlik buna göre verildi, yoksa
                    roketin 68px'inde okunamayacak kadar inceliyor.
                    Dosya adındaki büyük T bilerek: Linux'ta dosya adları
                    büyük/küçük harfe duyarlı. */}
                <img
                  src="/brand/gravio-Text.png"
                  alt="GravioAI"
                  style={{ width: 270, maxWidth: "100%", height: "auto", display: "block", marginBottom: 26 }}
                />
                <h2 style={{ fontSize: 28, fontWeight: 700, color: "var(--ink-900)", margin: "0 0 12px", letterSpacing: "-.015em", lineHeight: 1.25 }}>
                  Hoş geldin! İşletmeni tanıyalım.
                </h2>
                <p style={{ fontSize: 15.5, color: "var(--ink-600)", lineHeight: 1.65, margin: "0 0 28px", maxWidth: 540 }}>
                  Elinde bir CV ya da şirket dokümanı varsa yükle — sektör, şehir,
                  ekip gibi bilgileri oradan okuyup formu senin yerine dolduralım.
                  İstersen bilgileri kendin de girebilirsin.
                </p>

                {/* Belge yükleme en başta: dokümanda alanların çoğu zaten var,
                    önce okuyup sonraki adımları ön-doldurmak kullanıcıyı aynı
                    bilgiyi iki kez yazmaktan kurtarıyor. */}
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "20px 22px",
                    borderRadius: 16,
                    border: "1.5px dashed var(--terracotta-600)",
                    background: "var(--terracotta-100)",
                    cursor: docUpload.status === "loading" ? "default" : "pointer",
                    maxWidth: 540,
                  }}
                >
                  <Ms
                    name={docUpload.status === "loading" ? "hourglass_top" : "upload_file"}
                    size={26}
                    color="var(--terracotta-700)"
                  />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-900)" }}>
                      {docUpload.status === "loading" ? "Belge okunuyor…" : "Belge yükle"}
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-600)", marginTop: 2 }}>
                      CV veya şirket dokümanı · PDF, DOCX, TXT
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleDocumentUpload}
                    disabled={docUpload.status === "loading"}
                    style={{ display: "none" }}
                  />
                </label>

                {docUpload.status === "success" && (
                  <p style={{ fontSize: 13, color: "var(--success-700)", margin: "10px 0 0", maxWidth: 540 }}>
                    {docUpload.message} Sonraki adımlarda kontrol edip düzeltebilirsin.
                  </p>
                )}
                {docUpload.status === "error" && (
                  <p style={{ fontSize: 13, color: "var(--danger-700)", margin: "10px 0 0", maxWidth: 540 }}>
                    {docUpload.message}
                  </p>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", marginTop: 24 }}>
                  {/* Belge okunduysa birincil eylem "devam", okunmadıysa
                      "bilgileri kendim gireyim" — ikisi de aynı adıma gider. */}
                  <button
                    onClick={next}
                    style={{
                      padding: "15px 40px",
                      borderRadius: 13,
                      border: docUpload.status === "success" ? "none" : "1.5px solid var(--border-subtle)",
                      background:
                        docUpload.status === "success"
                          ? "linear-gradient(160deg,var(--terracotta-600),var(--terracotta-700))"
                          : "var(--surface-strong)",
                      color: docUpload.status === "success" ? "#fff" : "var(--ink-900)",
                      fontSize: 15.5,
                      fontWeight: 700,
                      boxShadow: docUpload.status === "success" ? "var(--shadow-cta)" : "none",
                    }}
                  >
                    {docUpload.status === "success" ? "Devam et" : "Bilgilerimi kendim gireyim"}
                  </button>
                  <button
                    onClick={onSkip}
                    style={{ fontSize: 14, color: "var(--ink-400)", textDecoration: "underline" }}
                  >
                    Geç, direkt sohbete başlayayım
                  </button>
                </div>
              </div>
            )}

            {step === "sector" && (
              <div>
                <StepHeading title="Hangi sektördesin?" sub="Sana en uygun destekleri filtrelemek için" />
                <div className="onboarding-sector-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {SECTORS.map((s) => {
                    const active = form.sector === s.key;
                    return (
                      <button
                        key={s.key}
                        onClick={() => setForm((f) => ({ ...f, sector: s.key }))}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          gap: 12,
                          padding: "18px 16px",
                          borderRadius: 14,
                          border: active ? "1.5px solid var(--terracotta-600)" : "1.5px solid var(--border-subtle)",
                          background: active ? "var(--terracotta-100)" : "var(--surface)",
                          textAlign: "left",
                          boxShadow: active ? "0 4px 14px rgba(168,80,46,.12)" : "none",
                          transition: "border .15s, background .15s, box-shadow .15s",
                        }}
                      >
                        <Ms name={s.icon} size={26} color={active ? "var(--terracotta-700)" : "var(--ink-600)"} />
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-900)", lineHeight: 1.3 }}>{s.key}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === "location" && (
              <div>
                <StepHeading title="Nerede ve ne zamandır?" sub="Bölgesel destekler ve kuruluş şartları için" />

                <label style={labelStyle}>Şirket adı (opsiyonel)</label>
                <input
                  value={form.companyName}
                  onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                  placeholder="ör. Nova AI Yazılım"
                  style={{ ...inputStyle, marginBottom: 24 }}
                />

                <label style={labelStyle}>Şehir</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="ör. Düzce"
                  style={{ ...inputStyle, marginBottom: 24 }}
                />

                <label style={labelStyle}>Kurulu bir şirketin var mı?</label>
                <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                  {[{ v: true, l: "Evet", icon: "business_center" }, { v: false, l: "Henüz yok", icon: "lightbulb" }].map((o) => {
                    const active = form.companyExists === o.v;
                    return (
                      <button
                        key={o.l}
                        onClick={() => setForm((f) => ({ ...f, companyExists: o.v }))}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 9,
                          padding: "15px 0",
                          borderRadius: 12,
                          border: active ? "1.5px solid var(--terracotta-600)" : "1.5px solid var(--border-subtle)",
                          background: active ? "var(--terracotta-100)" : "var(--surface)",
                          fontSize: 14.5,
                          fontWeight: 600,
                          color: "var(--ink-900)",
                        }}
                      >
                        <Ms name={o.icon} size={19} color={active ? "var(--terracotta-700)" : "var(--ink-600)"} />
                        {o.l}
                      </button>
                    );
                  })}
                </div>

                {form.companyExists && (
                  <>
                    <label style={labelStyle}>Kaç yıllık?</label>
                    <input
                      type="number"
                      min={0}
                      value={form.companyAgeYears}
                      onChange={(e) => setForm((f) => ({ ...f, companyAgeYears: e.target.value }))}
                      placeholder="ör. 2"
                      style={{ ...inputStyle, marginBottom: 24 }}
                    />
                    <p style={{ fontSize: 12.5, color: "var(--ink-400)", marginTop: -16, marginBottom: 24 }}>
                      Bazı programlar yalnızca belirli yaştan genç şirketlere açık — bu yüzden soruyoruz.
                    </p>
                  </>
                )}

                <label style={labelStyle}>Web sitesi (opsiyonel)</label>
                <input
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  placeholder="ör. nova-ai.com"
                  style={inputStyle}
                />
              </div>
            )}

            {step === "team" && (
              <div>
                <StepHeading title="Ekibinizi tanıyalım" sub="Bazı destekler ekip yapısına özel" />

                <label style={labelStyle}>Kaç kişisiniz?</label>
                <input
                  type="number"
                  min={1}
                  value={form.teamSize}
                  onChange={(e) => setForm((f) => ({ ...f, teamSize: e.target.value }))}
                  placeholder="ör. 3"
                  style={{ ...inputStyle, marginBottom: 24 }}
                />

                <label style={labelStyle}>Sizin için geçerli olanları işaretle</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { key: "womenEntrepreneur" as const, label: "Kadın girişimci", desc: "Kadın girişimcilere özel destek programları var", icon: "female" },
                    { key: "student" as const, label: "Öğrenci girişimci", desc: "Öğrencilere özel hibe ve yarışmalar var", icon: "school" },
                    { key: "inTechnopark" as const, label: "Teknoparkta yer alıyoruz", desc: "Teknopark firmalarına vergi avantajları var", icon: "corporate_fare" },
                  ].map((o) => {
                    const active = form[o.key];
                    return (
                      <button
                        key={o.key}
                        onClick={() => setForm((f) => ({ ...f, [o.key]: !f[o.key] }))}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          padding: "15px 16px",
                          borderRadius: 13,
                          border: active ? "1.5px solid var(--terracotta-600)" : "1.5px solid var(--border-subtle)",
                          background: active ? "var(--terracotta-100)" : "var(--surface)",
                          textAlign: "left",
                        }}
                      >
                        <Ms name={o.icon} size={22} color={active ? "var(--terracotta-700)" : "var(--ink-600)"} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink-900)" }}>{o.label}</div>
                          <div style={{ fontSize: 12.5, color: "var(--ink-400)", marginTop: 1 }}>{o.desc}</div>
                        </div>
                        <Ms
                          name={active ? "check_circle" : "radio_button_unchecked"}
                          size={21}
                          color={active ? "var(--terracotta-700)" : "var(--border-subtle)"}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === "goals" && (
              <div>
                <StepHeading title="Neye ihtiyacın var?" sub="İstediğin kadar seç — eşleştirmeyi buna göre önceliklendireceğiz" />
                <div className="onboarding-goals-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {GOALS.map((g) => {
                    const active = form.goals.includes(g);
                    return (
                      <button
                        key={g}
                        onClick={() => toggleGoal(g)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                          padding: "15px 16px",
                          borderRadius: 12,
                          border: active ? "1.5px solid var(--terracotta-600)" : "1.5px solid var(--border-subtle)",
                          background: active ? "var(--terracotta-100)" : "var(--surface)",
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--ink-900)",
                          textAlign: "left",
                        }}
                      >
                        {g}
                        <Ms
                          name={active ? "check_circle" : "add_circle"}
                          size={19}
                          color={active ? "var(--terracotta-700)" : "var(--border-subtle)"}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === "about" && (
              <div>
                <StepHeading
                  title="İşletmeni kendi cümlelerinle anlat"
                  sub="Opsiyonel ama önemli — eşleştirme motorumuz bu metni doğrudan kullanır"
                />
                <textarea
                  value={form.about}
                  onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))}
                  rows={6}
                  placeholder={
                    "ör. Düzce'de yapay zekâ tabanlı bir stok tahmin yazılımı geliştiriyoruz. " +
                    "KOBİ'lere satıyoruz, ilk 5 müşterimizi aldık. Ar-Ge hibesiyle modelimizi " +
                    "büyütmek, bulut maliyetlerimizi karşılamak istiyoruz."
                  }
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, fontFamily: "inherit" }}
                />

                <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 14, padding: "12px 14px", background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 11 }}>
                  <Ms name="tips_and_updates" size={17} color="var(--terracotta-700)" style={{ marginTop: 1, flexShrink: 0 }} />
                  <p style={{ fontSize: 12.5, color: "var(--terracotta-700)", lineHeight: 1.55, margin: 0 }}>
                    Ne ürettiğini, kime sattığını ve desteği ne için istediğini yazarsan
                    en isabetli sonuçları alırsın.
                  </p>
                </div>
              </div>
            )}

            {step === "consent" && (
              <div>
                <StepHeading title="Son bir adım" sub="Verilerini nasıl kullandığımızı onaylaman gerekiyor" />

                <div style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 14, padding: "18px 20px", marginBottom: 18 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Ms name="verified_user" size={20} color="var(--success-700)" style={{ marginTop: 1, flexShrink: 0 }} />
                    <p style={{ fontSize: 13.5, color: "var(--ink-600)", lineHeight: 1.6, margin: 0 }}>
                      Verdiğin bilgiler yalnızca sana uygun destekleri bulmak ve başvuru
                      hazırlamak için kullanılır, şifreli saklanır ve dilediğin zaman
                      silebilirsin.
                    </p>
                  </div>
                </div>

                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    fontSize: 14,
                    color: "var(--ink-900)",
                    cursor: "pointer",
                    padding: "15px 16px",
                    background: form.consent ? "var(--terracotta-100)" : "var(--surface)",
                    border: form.consent ? "1.5px solid var(--terracotta-600)" : "1.5px solid var(--border-subtle)",
                    borderRadius: 13,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.consent}
                    onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
                    style={{ width: 19, height: 19, marginTop: 1, accentColor: "var(--terracotta-600)", flexShrink: 0 }}
                  />
                  <span style={{ lineHeight: 1.55 }}>
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
              </div>
            )}

            {/* Navigasyon — welcome kendi butonlarını içeriyor */}
            {!isFirst && (
              <div style={{ display: "flex", gap: 12, marginTop: 34 }}>
                <button
                  onClick={back}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "14px 22px",
                    borderRadius: 13,
                    border: "1.5px solid var(--border-subtle)",
                    background: "var(--surface)",
                    fontSize: 14.5,
                    fontWeight: 600,
                    color: "var(--ink-600)",
                  }}
                >
                  <Ms name="arrow_back" size={17} />
                  Geri
                </button>
                <button
                  onClick={next}
                  disabled={!canProceed}
                  style={{
                    flex: 1,
                    maxWidth: 340,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "14px 0",
                    borderRadius: 13,
                    border: "none",
                    background: canProceed ? "linear-gradient(160deg,var(--terracotta-600),var(--terracotta-700))" : "var(--border-subtle)",
                    color: canProceed ? "#fff" : "var(--ink-400)",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: canProceed ? "pointer" : "not-allowed",
                    boxShadow: canProceed ? "0 8px 20px rgba(168,80,46,.25)" : "none",
                  }}
                >
                  {isLast ? "Profili oluştur" : "Devam et"}
                  {!isLast && <Ms name="arrow_forward" size={17} />}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      </div>
    </section>
  );
}