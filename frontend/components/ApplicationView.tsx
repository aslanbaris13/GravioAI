/**
 * Başvuru Hazırlığı ekranı.
 *
 * `applicationDraft` prop'u doluysa backend'den gelen gerçek veriler gösterilir.
 * Taslak yüklenmediyse (null) veya yükleme devam ediyorsa uygun bir durum mesajı sunulur.
 */
"use client";
import Ms from "./Ms";
import type { ApplicationDraft, DocItem } from "@/lib/types";

export default function ApplicationView({
  docs,
  applicationDraft,
  applyLoading,
  onToggleDoc,
  onBack,
  onCopyPlan,
  onDownloadPlan,
}: {
  docs: DocItem[];
  applicationDraft: ApplicationDraft | null;
  applyLoading: boolean;
  onToggleDoc: (id: string) => void;
  onBack: () => void;
  onCopyPlan: () => void;
  onDownloadPlan: () => void;
}) {
  const activeDocs = docs.length > 0 ? docs : [];
  const doneCount = activeDocs.filter((d) => d.done).length;
  const progressPct =
    activeDocs.length > 0 ? Math.round((doneCount / activeDocs.length) * 100) : 0;

  const programTitle = applicationDraft?.programName ?? "Başvuru Hazırlığı";
  const planTitle = applicationDraft?.planTitle ?? null;
  const planSections = applicationDraft?.planSections ?? [];

  return (
    <section data-screen-label="Başvuru hazırlığı" style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "26px 32px 60px" }}>
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#5a6b75", marginBottom: 18 }}
        >
          <Ms name="arrow_back" size={18} />
          Geri
        </button>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#14222c", margin: 0, letterSpacing: "-.01em" }}>
          {programTitle} — Başvuru Hazırlığı
        </h1>
        <p style={{ fontSize: 14, color: "#5a6b75", marginTop: 6 }}>
          Aşağıdaki belgeleri tamamla, iş planı taslağını gözden geçir ve başvurunu gönder.
        </p>

        {/* Yükleniyor durumu */}
        {applyLoading && (
          <div
            style={{
              marginTop: 24,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 18px",
              background: "#fff",
              border: "1px solid #e7e4dc",
              borderRadius: 12,
              color: "#5a6b75",
              fontSize: 14,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                border: "2px solid #f97316",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            Başvuru taslağı hazırlanıyor…
          </div>
        )}

        {/* İlerleme çubuğu — belgeler varsa */}
        {!applyLoading && activeDocs.length > 0 && (
          <div style={{ marginTop: 20, background: "#fff", border: "1px solid #e7e4dc", borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#27353e" }}>İlerleme</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#ea580c" }}>
                {doneCount}/{activeDocs.length} tamamlandı
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: "#f1efe8", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${progressPct}%`,
                  background: "linear-gradient(90deg,#f97316,#ea580c)",
                  borderRadius: 999,
                  transition: "width .3s",
                }}
              />
            </div>
          </div>
        )}

        {/* Belgeler */}
        {!applyLoading && activeDocs.length > 0 && (
          <>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#76858d", textTransform: "uppercase", letterSpacing: ".05em", marginTop: 26 }}>
              Belgeler
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              {activeDocs.map((d) => (
                <button
                  key={d.id}
                  onClick={() => onToggleDoc(d.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    textAlign: "left",
                    background: "#fff",
                    border: "1px solid #e7e4dc",
                    borderRadius: 12,
                    padding: "12px 14px",
                  }}
                >
                  <Ms
                    name={d.done ? "check_circle" : "radio_button_unchecked"}
                    size={21}
                    color={d.done ? "#15803d" : "#c2bdb1"}
                  />
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: d.done ? "#27353e" : "#5a6b75" }}>
                    {d.label}
                  </span>
                  {d.auto && (
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: "#0f6ea8", background: "#eef6fb", padding: "3px 8px", borderRadius: 999 }}>
                      Gravio hazırladı
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {/* İş planı taslağı */}
        {!applyLoading && (
          <>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#76858d", textTransform: "uppercase", letterSpacing: ".05em", marginTop: 26 }}>
              İş planı taslağı
            </h2>
            <div style={{ background: "#fff", border: "1px solid #e7e4dc", borderRadius: 14, padding: 20, marginTop: 12 }}>
              {planSections.length > 0 ? (
                <>
                  {planTitle && (
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#14222c", marginBottom: 14 }}>{planTitle}</div>
                  )}
                  {planSections.map((s) => (
                    <div key={s.heading} style={{ marginBottom: 13 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: "#ea580c", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 3 }}>
                        {s.heading}
                      </div>
                      <div style={{ fontSize: 13.5, lineHeight: 1.65, color: "#414f57" }}>{s.body}</div>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{ fontSize: 14, color: "#97a2aa", lineHeight: 1.6, textAlign: "center", padding: "24px 0" }}>
                  <Ms name="description" size={32} color="#d0cdc4" style={{ display: "block", margin: "0 auto 10px" }} />
                  İş planı taslağı henüz hazırlanmadı.
                  <br />
                  Chat ekranında bir programı seçip &ldquo;Başvuru hazırla&rdquo; deyin.
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button
                  onClick={onCopyPlan}
                  disabled={planSections.length === 0}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: "#27353e",
                    padding: "9px 14px",
                    borderRadius: 10,
                    border: "1px solid #e3e0d8",
                    opacity: planSections.length === 0 ? 0.4 : 1,
                  }}
                >
                  <Ms name="content_copy" size={16} />
                  Kopyala
                </button>
                <button
                  onClick={onDownloadPlan}
                  disabled={planSections.length === 0}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: "#fff",
                    padding: "9px 14px",
                    borderRadius: 10,
                    background: "linear-gradient(160deg,#f97316,#ea580c)",
                    opacity: planSections.length === 0 ? 0.4 : 1,
                  }}
                >
                  <Ms name="download" size={16} />
                  İndir (.txt)
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
