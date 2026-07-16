/**
 * İlk kullanım onboarding akışı.
 *
 * Sohbetin aksine yapılandırılmış sorularla ilerler — hiçbir adımı LLM
 * çağrısı gerektirmez, tamamen istemci tarafında çalışır. Son adımda
 * topladığı verilerden doğrudan bir BackendUserProfile üretir; bu profil
 * profil çıkarma ajanına hiç uğramadan sohbete/eşleştirmeye aktarılır.
 */
"use client";
import { useState } from "react";
import Ms from "./Ms";
import type { BackendUserProfile } from "@/lib/api";

const SECTORS = [
  { key: "Yazılım / Teknoloji", icon: "computer" },
  { key: "İmalat / Üretim", icon: "precision_manufacturing" },
  { key: "Ticaret / Perakende", icon: "storefront" },
  { key: "Tarım / Gıda", icon: "agriculture" },
  { key: "Turizm / Hizmet", icon: "hotel" },
  { key: "Diğer", icon: "category" },
];

const GOALS = [
  "Ar-Ge / Yenilik hibesi",
  "Yatırım veya hızlandırıcı",
  "Bulut altyapısı kredisi",
  "İstihdam desteği",
  "Vergi teşviki",
  "İhracat desteği",
];

type StepKey = "welcome" | "sector" | "location" | "team" | "goals" | "consent";

const STEPS: StepKey[] = ["welcome", "sector", "location", "team", "goals", "consent"];

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
  consent: false,
};

function buildProfile(f: FormState): BackendUserProfile {
  const parts: string[] = [];
  if (f.sector) parts.push(f.sector);
  if (f.city) parts.push(f.city);
  if (f.teamSize) parts.push(`${f.teamSize} kişilik ekip`);
  if (f.goals.length > 0) parts.push(f.goals.join(", ") + " arıyor");

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
    summary: parts.length > 0 ? parts.join(" — ") : null,
  };
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
  const step = STEPS[stepIndex];

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
    <section
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#eceae4",
        padding: "24px 20px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 480 }}>
        {!isFirst && (
          <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
            {STEPS.slice(1).map((s, i) => (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 999,
                  background: i <= stepIndex - 1 ? "#f97316" : "#ddd8cc",
                  transition: "background .25s",
                }}
              />
            ))}
          </div>
        )}

        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            border: "1px solid #e7e4dc",
            padding: "32px 28px",
            boxShadow: "0 8px 32px rgba(20,34,44,.06)",
            animation: "viewIn .3s ease",
          }}
        >
          {step === "welcome" && (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: "linear-gradient(160deg,#f97316,#ea580c)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <Ms name="radar" size={32} color="#fff" />
              </div>
              <h1 style={{ fontSize: 21, fontWeight: 700, color: "#14222c", margin: "0 0 10px", letterSpacing: "-.01em" }}>
                Yüzeyin altındaki fırsatı çıkaralım.
              </h1>
              <p style={{ fontSize: 14, color: "#5a6b75", lineHeight: 1.5, margin: 0 }}>
                20 saniyede birkaç soru — işletmene uygun devlet ve özel sektör
                desteklerini bulalım, uygunluğunu kontrol edip başvurunu hazırlayalım.
              </p>
            </div>
          )}

          {step === "sector" && (
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "#14222c", margin: "0 0 4px" }}>Hangi sektördesin?</h2>
              <p style={{ fontSize: 13, color: "#8b969c", margin: "0 0 20px" }}>Sana en uygun destekleri filtrelemek için</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {SECTORS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setForm((f) => ({ ...f, sector: s.key }))}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 8,
                      padding: "14px 12px",
                      borderRadius: 12,
                      border: form.sector === s.key ? "1.5px solid #f97316" : "1.5px solid #e7e4dc",
                      background: form.sector === s.key ? "#fff7ed" : "#fff",
                      textAlign: "left",
                    }}
                  >
                    <Ms name={s.icon} size={22} color={form.sector === s.key ? "#ea580c" : "#5a6b75"} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "#27353e" }}>{s.key}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "location" && (
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "#14222c", margin: "0 0 4px" }}>Nerede ve ne zamandır?</h2>
              <p style={{ fontSize: 13, color: "#8b969c", margin: "0 0 20px" }}>Bölgesel destekler ve kuruluş şartları için</p>

              <label style={{ fontSize: 12.5, fontWeight: 600, color: "#5a6b75", display: "block", marginBottom: 6 }}>Şehir</label>
              <input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="ör. Düzce"
                style={{
                  width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #e7e4dc",
                  fontSize: 14, marginBottom: 18, outline: "none",
                }}
              />

              <label style={{ fontSize: 12.5, fontWeight: 600, color: "#5a6b75", display: "block", marginBottom: 8 }}>Kurulu bir şirketin var mı?</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {[{ v: true, l: "Evet" }, { v: false, l: "Henüz yok" }].map((o) => (
                  <button
                    key={o.l}
                    onClick={() => setForm((f) => ({ ...f, companyExists: o.v }))}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: 10,
                      border: form.companyExists === o.v ? "1.5px solid #f97316" : "1.5px solid #e7e4dc",
                      background: form.companyExists === o.v ? "#fff7ed" : "#fff",
                      fontSize: 13.5, fontWeight: 600, color: "#27353e",
                    }}
                  >
                    {o.l}
                  </button>
                ))}
              </div>

              {form.companyExists && (
                <>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: "#5a6b75", display: "block", marginBottom: 6 }}>Kaç yıllık?</label>
                  <input
                    type="number"
                    min={0}
                    value={form.companyAgeYears}
                    onChange={(e) => setForm((f) => ({ ...f, companyAgeYears: e.target.value }))}
                    placeholder="ör. 2"
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #e7e4dc", fontSize: 14, outline: "none" }}
                  />
                </>
              )}
            </div>
          )}

          {step === "team" && (
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "#14222c", margin: "0 0 4px" }}>Ekibinizi tanıyalım</h2>
              <p style={{ fontSize: 13, color: "#8b969c", margin: "0 0 20px" }}>Bazı destekler ekip yapısına özel</p>

              <label style={{ fontSize: 12.5, fontWeight: 600, color: "#5a6b75", display: "block", marginBottom: 6 }}>Kaç kişisiniz?</label>
              <input
                type="number"
                min={1}
                value={form.teamSize}
                onChange={(e) => setForm((f) => ({ ...f, teamSize: e.target.value }))}
                placeholder="ör. 3"
                style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #e7e4dc", fontSize: 14, marginBottom: 18, outline: "none" }}
              />

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { key: "womenEntrepreneur" as const, label: "Kadın girişimci" },
                  { key: "student" as const, label: "Öğrenci girişimci" },
                  { key: "inTechnopark" as const, label: "Teknoparkta yer alıyoruz" },
                ].map((o) => (
                  <label key={o.key} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "#27353e", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={form[o.key]}
                      onChange={(e) => setForm((f) => ({ ...f, [o.key]: e.target.checked }))}
                      style={{ width: 18, height: 18, accentColor: "#f97316" }}
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === "goals" && (
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "#14222c", margin: "0 0 4px" }}>Neye ihtiyacın var?</h2>
              <p style={{ fontSize: 13, color: "#8b969c", margin: "0 0 20px" }}>İstediğin kadar seç</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {GOALS.map((g) => {
                  const active = form.goals.includes(g);
                  return (
                    <button
                      key={g}
                      onClick={() => toggleGoal(g)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 14px", borderRadius: 10,
                        border: active ? "1.5px solid #f97316" : "1.5px solid #e7e4dc",
                        background: active ? "#fff7ed" : "#fff",
                        fontSize: 13.5, fontWeight: 600, color: "#27353e", textAlign: "left",
                      }}
                    >
                      {g}
                      {active && <Ms name="check_circle" size={18} color="#ea580c" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === "consent" && (
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "#14222c", margin: "0 0 4px" }}>Son bir adım</h2>
              <p style={{ fontSize: 13, color: "#8b969c", margin: "0 0 20px" }}>Verilerini nasıl kullandığımızı onaylaman gerekiyor</p>

              <div style={{ background: "#f7f5ef", border: "1px solid #e7e4dc", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <Ms name="verified_user" size={18} color="#1f6f5c" style={{ marginTop: 1, flexShrink: 0 }} />
                  <p style={{ fontSize: 12.5, color: "#4b5a54", lineHeight: 1.5, margin: 0 }}>
                    Verdiğin bilgiler yalnızca sana uygun destekleri bulmak ve başvuru
                    hazırlamak için kullanılır, şifreli saklanır ve dilediğin zaman
                    silebilirsin.
                  </p>
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "#27353e", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
                  style={{ width: 18, height: 18, marginTop: 1, accentColor: "#f97316", flexShrink: 0 }}
                />
                <span>
                  Kişisel verilerimin{" "}
                  <a href="#" onClick={(e) => e.preventDefault()} style={{ color: "#ea580c", textDecoration: "underline" }}>
                    Aydınlatma Metni
                  </a>{" "}
                  kapsamında işlenmesini kabul ediyorum.
                </span>
              </label>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
            {!isFirst && (
              <button
                onClick={back}
                style={{
                  padding: "12px 18px", borderRadius: 12, border: "1.5px solid #e7e4dc",
                  background: "#fff", fontSize: 13.5, fontWeight: 600, color: "#5a6b75",
                }}
              >
                Geri
              </button>
            )}
            <button
              onClick={next}
              disabled={!canProceed}
              style={{
                flex: 1, padding: "13px 0", borderRadius: 12, border: "none",
                background: canProceed ? "linear-gradient(160deg,#f97316,#ea580c)" : "#e7e4dc",
                color: canProceed ? "#fff" : "#a8a296",
                fontSize: 14, fontWeight: 700,
                cursor: canProceed ? "pointer" : "not-allowed",
              }}
            >
              {isLast ? "Tamamla" : isFirst ? "Başlayalım" : "Devam et"}
            </button>
          </div>
        </div>

        {isFirst && (
          <button
            onClick={onSkip}
            style={{ display: "block", margin: "16px auto 0", fontSize: 12.5, color: "#8b969c", textDecoration: "underline" }}
          >
            Geç, direkt sohbete başlayayım
          </button>
        )}
      </div>
    </section>
  );
}
