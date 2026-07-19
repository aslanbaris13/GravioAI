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
  border: "1.5px solid #e0ddd4",
  fontSize: 15,
  color: "#14222c",
  background: "#fff",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontSize: 13.5,
  fontWeight: 600,
  color: "#5a6b75",
  display: "block",
  marginBottom: 8,
};

function StepHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#14222c", margin: "0 0 6px", letterSpacing: "-.01em" }}>
        {title}
      </h2>
      <p style={{ fontSize: 14.5, color: "#8b969c", margin: 0 }}>{sub}</p>
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
    <section style={{ display: "flex", height: "100vh", background: "#eceae4" }}>
      {/* ---------------- Sol panel — marka + ilerleme ---------------- */}
      <aside
        className="onboarding-aside"
        style={{
          width: 380,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(177deg,#0d2a3c 0%,#0a1f2d 100%)",
          color: "#c6d3db",
          padding: "34px 30px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "linear-gradient(140deg,#f97316,#ea580c)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(234,88,12,.35)",
            }}
          >
            <Ms name="radar" size={24} color="#fff" />
          </div>
          <div style={{ lineHeight: 1.05 }}>
            <div style={{ fontSize: 19, fontWeight: 700, color: "#fff", letterSpacing: "-.02em" }}>GravioAI</div>
            <div style={{ fontSize: 11, color: "#7d93a1", fontWeight: 500, marginTop: 2 }}>Fırsat asistanı</div>
          </div>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", lineHeight: 1.3, letterSpacing: "-.01em", margin: "44px 0 10px" }}>
          Yüzeyin altındaki fırsatı çıkaralım.
        </h1>
        <p style={{ fontSize: 13.5, color: "#8fa3b0", lineHeight: 1.6, margin: "0 0 36px" }}>
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
                  boxShadow: active ? "inset 3px 0 0 #f97316" : "none",
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
                    background: done ? "linear-gradient(140deg,#f97316,#ea580c)" : active ? "rgba(249,115,22,.18)" : "rgba(255,255,255,.06)",
                    border: active ? "1.5px solid #f97316" : "1.5px solid transparent",
                  }}
                >
                  {done ? (
                    <Ms name="check" size={16} color="#fff" />
                  ) : (
                    <Ms name={s.icon} size={15} color={active ? "#ffb27a" : "#5f7686"} />
                  )}
                </div>
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: done ? "#dce6ec" : active ? "#fff" : "#5f7686",
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
            <Ms name="verified_user" size={17} color="#ffb27a" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#dce6ec" }}>Verilerin güvende</span>
          </div>
          <div style={{ fontSize: 11.5, lineHeight: 1.55, color: "#8499a6" }}>
            Verdiğin bilgiler yalnızca sana uygun destekleri bulmak için kullanılır,
            şifreli saklanır ve dilediğin zaman silebilirsin.
          </div>
        </div>
      </aside>

      {/* ---------------- Sağ panel — adım içeriği ---------------- */}
      <main
        className="onboarding-main"
        style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: "48px 56px 80px" }}
      >
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
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
                      background: stepIndex >= idx ? "#f97316" : "#ddd8cc",
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
                <div
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: 18,
                    background: "linear-gradient(160deg,#f97316,#ea580c)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 10px 28px rgba(234,88,12,.3)",
                    marginBottom: 26,
                  }}
                >
                  <Ms name="radar" size={34} color="#fff" />
                </div>
                <h2 style={{ fontSize: 28, fontWeight: 700, color: "#14222c", margin: "0 0 12px", letterSpacing: "-.015em", lineHeight: 1.25 }}>
                  Hoş geldin! İşletmeni tanıyalım.
                </h2>
                <p style={{ fontSize: 15.5, color: "#5a6b75", lineHeight: 1.65, margin: "0 0 10px", maxWidth: 520 }}>
                  Yaklaşık bir dakikanı alacak birkaç soruyla profilini çıkaracağız.
                  Ne kadar çok bilgi verirsen, eşleşmeler o kadar isabetli olur.
                </p>
                <p style={{ fontSize: 13.5, color: "#8b969c", lineHeight: 1.6, margin: "0 0 34px", maxWidth: 520 }}>
                  Form doldurmayı sevmiyorsan atlayabilirsin — sohbet ekranında
                  işletmeni kendi cümlelerinle anlatman da yeterli.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
                  <button
                    onClick={next}
                    style={{
                      padding: "15px 44px",
                      borderRadius: 13,
                      border: "none",
                      background: "linear-gradient(160deg,#f97316,#ea580c)",
                      color: "#fff",
                      fontSize: 15.5,
                      fontWeight: 700,
                      boxShadow: "0 8px 20px rgba(234,88,12,.28)",
                    }}
                  >
                    Başlayalım
                  </button>
                  <button
                    onClick={onSkip}
                    style={{ fontSize: 14, color: "#8b969c", textDecoration: "underline" }}
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
                          border: active ? "1.5px solid #f97316" : "1.5px solid #e0ddd4",
                          background: active ? "#fff7ed" : "#fff",
                          textAlign: "left",
                          boxShadow: active ? "0 4px 14px rgba(234,88,12,.12)" : "none",
                          transition: "border .15s, background .15s, box-shadow .15s",
                        }}
                      >
                        <Ms name={s.icon} size={26} color={active ? "#ea580c" : "#5a6b75"} />
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: "#27353e", lineHeight: 1.3 }}>{s.key}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === "location" && (
              <div>
                <StepHeading title="Nerede ve ne zamandır?" sub="Bölgesel destekler ve kuruluş şartları için" />

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
                          border: active ? "1.5px solid #f97316" : "1.5px solid #e0ddd4",
                          background: active ? "#fff7ed" : "#fff",
                          fontSize: 14.5,
                          fontWeight: 600,
                          color: "#27353e",
                        }}
                      >
                        <Ms name={o.icon} size={19} color={active ? "#ea580c" : "#5a6b75"} />
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
                      style={inputStyle}
                    />
                    <p style={{ fontSize: 12.5, color: "#97a2aa", marginTop: 8 }}>
                      Bazı programlar yalnızca belirli yaştan genç şirketlere açık — bu yüzden soruyoruz.
                    </p>
                  </>
                )}
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
                          border: active ? "1.5px solid #f97316" : "1.5px solid #e0ddd4",
                          background: active ? "#fff7ed" : "#fff",
                          textAlign: "left",
                        }}
                      >
                        <Ms name={o.icon} size={22} color={active ? "#ea580c" : "#5a6b75"} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14.5, fontWeight: 600, color: "#27353e" }}>{o.label}</div>
                          <div style={{ fontSize: 12.5, color: "#97a2aa", marginTop: 1 }}>{o.desc}</div>
                        </div>
                        <Ms
                          name={active ? "check_circle" : "radio_button_unchecked"}
                          size={21}
                          color={active ? "#ea580c" : "#d0cdc4"}
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
                          border: active ? "1.5px solid #f97316" : "1.5px solid #e0ddd4",
                          background: active ? "#fff7ed" : "#fff",
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#27353e",
                          textAlign: "left",
                        }}
                      >
                        {g}
                        <Ms
                          name={active ? "check_circle" : "add_circle"}
                          size={19}
                          color={active ? "#ea580c" : "#d0cdc4"}
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

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#5a6b75",
                      cursor: docUpload.status === "loading" ? "default" : "pointer",
                      padding: "9px 15px",
                      border: "1.5px solid #e0ddd4",
                      borderRadius: 10,
                      background: "#fff",
                    }}
                  >
                    <Ms name={docUpload.status === "loading" ? "hourglass_top" : "upload_file"} size={16} color="#5a6b75" />
                    {docUpload.status === "loading" ? "Okunuyor…" : "CV/şirket dokümanı yükle (PDF/DOCX)"}
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleDocumentUpload}
                      disabled={docUpload.status === "loading"}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
                {docUpload.status === "success" && (
                  <p style={{ fontSize: 12.5, color: "#1f6f5c", marginTop: 8 }}>{docUpload.message}</p>
                )}
                {docUpload.status === "error" && (
                  <p style={{ fontSize: 12.5, color: "#b94040", marginTop: 8 }}>{docUpload.message}</p>
                )}

                <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 14, padding: "12px 14px", background: "#fff", border: "1px solid #e7e4dc", borderRadius: 11 }}>
                  <Ms name="tips_and_updates" size={17} color="#a86b12" style={{ marginTop: 1, flexShrink: 0 }} />
                  <p style={{ fontSize: 12.5, color: "#7a6a45", lineHeight: 1.55, margin: 0 }}>
                    Ne ürettiğini, kime sattığını ve desteği ne için istediğini yazarsan
                    en isabetli sonuçları alırsın.
                  </p>
                </div>
              </div>
            )}

            {step === "consent" && (
              <div>
                <StepHeading title="Son bir adım" sub="Verilerini nasıl kullandığımızı onaylaman gerekiyor" />

                <div style={{ background: "#fff", border: "1px solid #e7e4dc", borderRadius: 14, padding: "18px 20px", marginBottom: 18 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Ms name="verified_user" size={20} color="#1f6f5c" style={{ marginTop: 1, flexShrink: 0 }} />
                    <p style={{ fontSize: 13.5, color: "#4b5a54", lineHeight: 1.6, margin: 0 }}>
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
                    color: "#27353e",
                    cursor: "pointer",
                    padding: "15px 16px",
                    background: form.consent ? "#fff7ed" : "#fff",
                    border: form.consent ? "1.5px solid #f97316" : "1.5px solid #e0ddd4",
                    borderRadius: 13,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.consent}
                    onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
                    style={{ width: 19, height: 19, marginTop: 1, accentColor: "#f97316", flexShrink: 0 }}
                  />
                  <span style={{ lineHeight: 1.55 }}>
                    Kişisel verilerimin{" "}
                    <a
                      href="/legal/aydinlatma-metni"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: "#ea580c", textDecoration: "underline" }}
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
                    border: "1.5px solid #e0ddd4",
                    background: "#fff",
                    fontSize: 14.5,
                    fontWeight: 600,
                    color: "#5a6b75",
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
                    background: canProceed ? "linear-gradient(160deg,#f97316,#ea580c)" : "#e7e4dc",
                    color: canProceed ? "#fff" : "#a8a296",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: canProceed ? "pointer" : "not-allowed",
                    boxShadow: canProceed ? "0 8px 20px rgba(234,88,12,.25)" : "none",
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
    </section>
  );
}
