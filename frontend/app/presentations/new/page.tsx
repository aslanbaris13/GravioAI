"use client";
import { useState } from "react";
import Ms from "@/components/Ms";
import {
  generatePresentation,
  exportPresentationPptx,
  ApiError,
} from "@/lib/api";
import type { BackendGeneratedPresentation } from "@/lib/api";
import { useAppState } from "@/lib/AppStateContext";

type SubmitState = "idle" | "submitting" | "done" | "error";

export default function NewPresentationPage() {
  const { currentProfile, goToPanel } = useAppState();
  const [companyName, setCompanyName] = useState("");
  const [extraContext, setExtraContext] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState("");
  const [presentation, setPresentation] = useState<BackendGeneratedPresentation | null>(null);
  const [downloading, setDownloading] = useState(false);

  async function onSubmit() {
    setSubmitState("submitting");
    setSubmitError("");
    try {
      const result = await generatePresentation(
        currentProfile ?? { goals: [] },
        companyName,
        extraContext,
      );
      setPresentation(result);
      setSubmitState("done");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Beklenmeyen bir hata oluştu.";
      setSubmitError(msg);
      setSubmitState("error");
    }
  }

  async function onDownload() {
    if (!presentation) return;
    setDownloading(true);
    try {
      const blob = await exportPresentationPptx(presentation);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${presentation.title.replace(/\s+/g, "-")}-Sunum.pptx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "26px 32px 80px" }}>
        <button
          onClick={goToPanel}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#5a6b75", fontWeight: 600, marginBottom: 18 }}
        >
          <Ms name="arrow_back" size={17} />
          Panelime dön
        </button>

        <h1 style={{ fontSize: 21, fontWeight: 700, color: "#14222c", margin: "0 0 4px", letterSpacing: "-.01em" }}>
          Şirket sunumu oluştur
        </h1>
        <p style={{ fontSize: 13.5, color: "#5a6b75", margin: "0 0 24px" }}>
          Gerçek yatırımcı sunumu şablonlarına (Airbnb'nin ilk yatırım sunumu, Y Combinator ve Sequoia'nın
          önerdiği yapı) dayanan sabit bir iskeleti (kapak, problem, çözüm, neden şimdi, ürün, pazar,
          traksiyon, rekabet, iş modeli, ekip, finansal projeksiyon, yol haritası, kapanış) profiline göre
          özelleştiriyoruz.
        </p>

        {submitState !== "done" && (
          <>
            <div style={{ background: "#fff", border: "1px solid #e7e4dc", borderRadius: 12, padding: "16px 18px", marginBottom: 12 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "#5a6b75", display: "block", marginBottom: 6 }}>
                Şirket adı
              </label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="ör. Nova AI Yazılım"
                style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #e7e4dc", fontSize: 13.5, marginBottom: 14 }}
              />
              <label style={{ fontSize: 12.5, fontWeight: 600, color: "#5a6b75", display: "block", marginBottom: 6 }}>
                Ek bağlam (opsiyonel)
              </label>
              <textarea
                value={extraContext}
                onChange={(e) => setExtraContext(e.target.value)}
                rows={4}
                placeholder="Ürün hakkında, rakiplerden farkın, hedeflerin vb. — ne kadar çok bilgi verirsen o kadar isabetli olur."
                style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #e7e4dc", fontSize: 13.5, fontFamily: "inherit", resize: "vertical" }}
              />
            </div>

            {submitState === "error" && (
              <div style={{ background: "#fdf6e8", border: "1px solid #f0e0b8", borderRadius: 12, padding: "13px 16px", marginBottom: 12, fontSize: 13, color: "#7a5f1e" }}>
                {submitError || "Sunum oluşturulamadı, tekrar dene."}
              </div>
            )}

            <button
              onClick={onSubmit}
              disabled={submitState === "submitting"}
              style={{
                width: "100%",
                padding: "13px 0",
                borderRadius: 12,
                border: "none",
                background: submitState === "submitting" ? "#e7e4dc" : "linear-gradient(160deg,#f97316,#ea580c)",
                color: submitState === "submitting" ? "#a8a296" : "#fff",
                fontSize: 14,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Ms name="auto_awesome" size={18} />
              {submitState === "submitting" ? "Oluşturuluyor… (10 slayt, biraz sürebilir)" : "Sunumu oluştur"}
            </button>
          </>
        )}

        {submitState === "done" && presentation && (
          <>
            <div style={{ background: "#fff", border: "1px solid #e7e4dc", borderRadius: 12, padding: "18px 20px", marginBottom: 16, textAlign: "center" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#14222c", margin: "0 0 2px" }}>{presentation.title}</h2>
              <p style={{ fontSize: 13, color: "#8a96a0", margin: 0 }}>{presentation.subtitle}</p>
            </div>
            {presentation.slides.map((s, i) => (
              <div key={s.slide_id} style={{ background: "#fff", border: "1px solid #e7e4dc", borderRadius: 12, padding: "16px 18px", marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#8a96a0", marginBottom: 6 }}>
                  Slayt {i + 2} — {s.heading}
                </div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {s.bullets.map((b, j) => (
                    <li key={j} style={{ fontSize: 13, color: "#414f57", marginBottom: 4 }}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
            <button
              onClick={onDownload}
              disabled={downloading}
              style={{
                width: "100%",
                marginTop: 8,
                padding: "13px 0",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(160deg,#f97316,#ea580c)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Ms name="download" size={18} />
              {downloading ? "İndiriliyor…" : "PPTX olarak indir"}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
