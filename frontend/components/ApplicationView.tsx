"use client";
import Ms from "./Ms";
import { PLAN_TITLE, PLAN_PARAGRAPHS } from "@/lib/plan";
import type { DocItem } from "@/lib/types";

export default function ApplicationView({
  docs,
  onToggleDoc,
  onBack,
  onCopyPlan,
  onDownloadPlan,
}: {
  docs: DocItem[];
  onToggleDoc: (id: string) => void;
  onBack: () => void;
  onCopyPlan: () => void;
  onDownloadPlan: () => void;
}) {
  const doneCount = docs.filter((d) => d.done).length;
  const progressPct = Math.round((doneCount / docs.length) * 100);

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
          TÜBİTAK 1512 BİGG — Başvuru Hazırlığı
        </h1>
        <p style={{ fontSize: 14, color: "#5a6b75", marginTop: 6 }}>
          Aşağıdaki belgeleri tamamla, iş planı taslağını gözden geçir ve başvurunu gönder.
        </p>

        <div style={{ marginTop: 20, background: "#fff", border: "1px solid #e7e4dc", borderRadius: 14, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#27353e" }}>İlerleme</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#ea580c" }}>
              {doneCount}/{docs.length} tamamlandı
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: "#f1efe8", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progressPct}%`, background: "linear-gradient(90deg,#f97316,#ea580c)", borderRadius: 999, transition: "width .3s" }} />
          </div>
        </div>

        <h2 style={{ fontSize: 13, fontWeight: 700, color: "#76858d", textTransform: "uppercase", letterSpacing: ".05em", marginTop: 26 }}>
          Belgeler
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {docs.map((d) => (
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
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: d.done ? "#27353e" : "#5a6b75" }}>{d.label}</span>
              {d.auto && (
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#0f6ea8", background: "#eef6fb", padding: "3px 8px", borderRadius: 999 }}>
                  Gravio hazırladı
                </span>
              )}
            </button>
          ))}
        </div>

        <h2 style={{ fontSize: 13, fontWeight: 700, color: "#76858d", textTransform: "uppercase", letterSpacing: ".05em", marginTop: 26 }}>
          İş planı taslağı
        </h2>
        <div style={{ background: "#fff", border: "1px solid #e7e4dc", borderRadius: 14, padding: 20, marginTop: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#14222c", marginBottom: 14 }}>{PLAN_TITLE}</div>
          {PLAN_PARAGRAPHS.map((p) => (
            <div key={p.heading} style={{ marginBottom: 13 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#ea580c", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 3 }}>
                {p.heading}
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.65, color: "#414f57" }}>{p.body}</div>
            </div>
          ))}

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button
              onClick={onCopyPlan}
              style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, color: "#27353e", padding: "9px 14px", borderRadius: 10, border: "1px solid #e3e0d8" }}
            >
              <Ms name="content_copy" size={16} />
              Kopyala
            </button>
            <button
              onClick={onDownloadPlan}
              style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 600, color: "#fff", padding: "9px 14px", borderRadius: 10, background: "linear-gradient(160deg,#f97316,#ea580c)" }}
            >
              <Ms name="download" size={16} />
              İndir (.txt)
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
