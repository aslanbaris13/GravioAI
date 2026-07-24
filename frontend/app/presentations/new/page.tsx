"use client";
import { useEffect, useState } from "react";
import Ms from "@/components/Ms";
import {
  generatePresentation,
  exportPresentationPptx,
  listPresentations,
  ApiError,
} from "@/lib/api";
import type { BackendGeneratedPresentation, BackendPresentationRecord } from "@/lib/api";
import { useAppState } from "@/lib/AppStateContext";
import { getSessionId } from "@/lib/session";

type SubmitState = "idle" | "submitting" | "done" | "error";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export default function NewPresentationPage() {
  const { currentProfile, goToPanel } = useAppState();
  const [companyName, setCompanyName] = useState("");
  const [extraContext, setExtraContext] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState("");
  const [presentation, setPresentation] = useState<BackendGeneratedPresentation | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [pastPresentations, setPastPresentations] = useState<BackendPresentationRecord[]>([]);
  const [downloadingPastId, setDownloadingPastId] = useState<string | null>(null);

  const sessionId = getSessionId();

  const refreshPast = () => {
    if (!sessionId) return;
    listPresentations(sessionId)
      .then(setPastPresentations)
      .catch(() => {});
  };

  useEffect(() => {
    refreshPast();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit() {
    setSubmitState("submitting");
    setSubmitError("");
    try {
      const result = await generatePresentation(
        currentProfile ?? { goals: [] },
        companyName,
        extraContext,
        sessionId ?? undefined,
      );
      setPresentation(result);
      setSubmitState("done");
      refreshPast();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Beklenmeyen bir hata oluştu.";
      setSubmitError(msg);
      setSubmitState("error");
    }
  }

  async function downloadPptx(p: BackendGeneratedPresentation, filenameStem: string) {
    const blob = await exportPresentationPptx(p);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenameStem.replace(/\s+/g, "-")}-Sunum.pptx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onDownload() {
    if (!presentation) return;
    setDownloading(true);
    try {
      await downloadPptx(presentation, presentation.title);
    } finally {
      setDownloading(false);
    }
  }

  async function onDownloadPast(record: BackendPresentationRecord) {
    setDownloadingPastId(record.id);
    try {
      await downloadPptx(
        { title: record.title, subtitle: record.subtitle, slides: record.slides },
        record.title,
      );
    } finally {
      setDownloadingPastId(null);
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

        {submitState !== "done" && pastPresentations.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#76858d", textTransform: "uppercase", letterSpacing: ".05em", margin: "0 0 10px" }}>
              Geçmiş Sunumlarım
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pastPresentations.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: "#fff", border: "1px solid #e7e4dc", borderRadius: 12, padding: "12px 14px",
                  }}
                >
                  <div
                    style={{
                      width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                      background: "linear-gradient(140deg,#f97316,#ea580c)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, color: "#fff",
                    }}
                  >
                    ◎
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#27353e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#8a96a0", marginTop: 1 }}>
                      {p.slides.length + 1} slayt · {formatDate(p.created_at)}
                    </div>
                  </div>
                  <button
                    onClick={() => onDownloadPast(p)}
                    disabled={downloadingPastId === p.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
                      fontSize: 12.5, fontWeight: 700, color: "#ea580c",
                      padding: "7px 12px", borderRadius: 9, border: "1px solid #f0d9c5", background: "#fff7ed",
                    }}
                  >
                    <Ms name="download" size={15} />
                    {downloadingPastId === p.id ? "İndiriliyor…" : "İndir"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
            <p style={{ fontSize: 12, color: "#8a96a0", margin: "0 0 12px" }}>
              {presentation.slides.length + 1} slaytlık önizleme — PowerPoint&apos;te tamamen düzenlenebilir.
            </p>

            {/* Kapak — gerçek PPTX'teki lacivert kapak slaydının önizlemesi */}
            <div
              style={{
                background: "linear-gradient(155deg,#0a1f2d,#0d2a3c)",
                borderRadius: 14,
                padding: "28px 26px",
                marginBottom: 12,
                aspectRatio: "16/9",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(140deg,#f97316,#ea580c)",
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
                  fontSize: 18, color: "#fff", fontWeight: 700,
                }}
              >
                ◎
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 0 6px", letterSpacing: "-.01em" }}>
                {presentation.title}
              </h2>
              {presentation.subtitle && (
                <p style={{ fontSize: 13, color: "#aec4d2", margin: 0, fontStyle: "italic" }}>{presentation.subtitle}</p>
              )}
            </div>

            {presentation.slides.map((s, i) => {
              const isClosing = i === presentation.slides.length - 1;
              return (
                <div
                  key={s.slide_id}
                  style={{
                    background: isClosing ? "#0a1f2d" : "#fff",
                    border: isClosing ? "none" : "1px solid #e7e4dc",
                    borderRadius: 14,
                    padding: "20px 22px",
                    marginBottom: 10,
                    aspectRatio: "16/9",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: isClosing ? "#f97316" : "#ea580c", marginBottom: 4 }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: isClosing ? "#fff" : "#14222c", marginBottom: 12 }}>
                    {s.heading}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" }}>
                    {s.bullets.map((b, j) => (
                      <div key={j} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ color: isClosing ? "#f97316" : "#ea580c", fontSize: 11, marginTop: 3, flexShrink: 0 }}>●</span>
                        <span style={{ fontSize: 12.5, color: isClosing ? "#d7e2e8" : "#414f57", lineHeight: 1.45 }}>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
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
