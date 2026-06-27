"use client";
import Ms from "./Ms";
import { toVM } from "@/lib/viewmodel";
import { deadlinePillStyle, deadlineDaysText } from "@/lib/viewmodel";
import type { Program } from "@/lib/types";

export default function DetailView({
  program,
  onBack,
  onCheckEligibility,
}: {
  program: Program;
  onBack: () => void;
  onCheckEligibility: () => void;
}) {
  const c = toVM(program);

  return (
    <section data-screen-label="Program detayı" style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "26px 32px 60px" }}>
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#5a6b75", marginBottom: 18 }}
        >
          <Ms name="arrow_back" size={18} />
          Eşleşmelere dön
        </button>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={c.iconWrapLgStyle}>
            <Ms name={c.icon} size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#14222c", margin: 0, letterSpacing: "-.01em" }}>{c.name}</h1>
              <span style={c.statusBadgeStyle}>
                <span style={c.statusDotStyle} />
                {c.statusLabel}
              </span>
            </div>
            <div style={{ fontSize: 13, color: "#8a96a0", marginTop: 4 }}>
              {c.org} · {c.categoryLabel} · {c.typeLabel}
            </div>
          </div>
          <div style={deadlinePillStyle(c.deadlineDays)}>{deadlineDaysText(c.deadlineDays)}</div>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 22, padding: "16px 18px", background: "#fff", border: "1px solid #e7e4dc", borderRadius: 14 }}>
          <Ms name="payments" size={22} color="#ea580c" />
          <span style={{ fontSize: 23, fontWeight: 800, color: "#ea580c", fontVariantNumeric: "tabular-nums" }}>{c.amountDisplayText}</span>
          <span style={{ fontSize: 12.5, color: "#97a2aa", fontWeight: 600 }}>{c.amountSub}</span>
          {c.curCodeDisplay && <span style={c.curBadgeStyle}>{c.curCodeDisplay}</span>}
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#97a2aa" }}>{c.rate}</span>
        </div>

        <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "#414f57", marginTop: 20 }}>{c.summary}</p>

        <h2 style={{ fontSize: 13, fontWeight: 700, color: "#76858d", textTransform: "uppercase", letterSpacing: ".05em", marginTop: 28 }}>
          Temel kriterler
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
          {c.criteria.map((cr) => (
            <div key={cr.label} style={{ display: "flex", alignItems: "center", gap: 11, background: "#fff", border: "1px solid #e7e4dc", borderRadius: 12, padding: "11px 13px" }}>
              <Ms name={cr.icon} size={19} color="#5a6b75" />
              <div>
                <div style={{ fontSize: 10.5, color: "#97a2aa", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".03em" }}>{cr.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#27353e" }}>{cr.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 30,
            padding: "16px 18px",
            borderRadius: 14,
            background: "#fbfaf7",
            border: "1px solid #ebe8e0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Ms name="link" size={18} color="#5a6b75" />
            <a href={c.sourceHref} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600, color: "#0f6ea8" }}>
              {c.sourceLink}
            </a>
            <span style={{ fontSize: 11.5, color: "#97a2aa" }}>· güncelleme {c.updated}</span>
          </div>
        </div>

        <button
          onClick={onCheckEligibility}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 9,
            width: "100%",
            marginTop: 22,
            padding: "14px 0",
            borderRadius: 13,
            background: "linear-gradient(160deg,#f97316,#ea580c)",
            color: "#fff",
            fontSize: 14.5,
            fontWeight: 700,
            boxShadow: "0 8px 20px rgba(234,88,12,.28)",
          }}
        >
          <Ms name={c.eligIconName} size={20} />
          Uygunluğumu kontrol et
        </button>
      </div>
    </section>
  );
}
