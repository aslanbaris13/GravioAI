"use client";
import Ms from "./Ms";
import OrgLogo from "./OrgLogo";
import { toVM } from "@/lib/viewmodel";
import { deadlinePillStyle, deadlineDaysText } from "@/lib/viewmodel";
import type { Program } from "@/lib/types";

export default function DetailView({
  program,
  onBack,
  onCheckEligibility,
  onViewReportRequirements,
}: {
  program: Program;
  /** Verilmezse "Eşleşmelere dön" hiç çizilmez — ana sayfadan gelen ve henüz
   *  eşleşmesi olmayan ziyaretçiyi boş bir listeye göndermemek için. */
  onBack?: () => void;
  onCheckEligibility: () => void;
  onViewReportRequirements?: () => void;
}) {
  const c = toVM(program);

  return (
    <section data-screen-label="Program detayı" style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "26px 32px 60px" }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--ink-600)", marginBottom: 18 }}
          >
            <Ms name="arrow_back" size={18} />
            Eşleşmelere dön
          </button>
        )}

        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <OrgLogo org={c.org} icon={c.icon} wrapStyle={c.iconWrapLgStyle} iconSize={28} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink-900)", margin: 0, letterSpacing: "-.01em" }}>{c.name}</h1>
              <span style={c.statusBadgeStyle}>
                <span style={c.statusDotStyle} />
                {c.statusLabel}
              </span>
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-400)", marginTop: 4 }}>
              {c.org} · {c.categoryLabel} · {c.typeLabel}
            </div>
          </div>
          <div style={deadlinePillStyle(c.deadlineDays)}>{deadlineDaysText(c.deadlineDays)}</div>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 22, padding: "16px 18px", background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 14 }}>
          <Ms name="payments" size={22} color="var(--terracotta-700)" />
          <span style={{ fontSize: 23, fontWeight: 800, color: "var(--terracotta-700)", fontVariantNumeric: "tabular-nums" }}>{c.amountDisplayText}</span>
          <span style={{ fontSize: 12.5, color: "var(--ink-400)", fontWeight: 600 }}>{c.amountSub}</span>
          {c.curCodeDisplay && <span style={c.curBadgeStyle}>{c.curCodeDisplay}</span>}
          <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--ink-400)" }}>{c.rate}</span>
        </div>

        <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--ink-900)", marginTop: 20 }}>{c.summary}</p>

        {c.criteria.length > 0 && (
        <>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-600)", textTransform: "uppercase", letterSpacing: ".05em", marginTop: 28 }}>
          Temel kriterler
        </h2>
        <div className="detail-criteria-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
          {c.criteria.map((cr) => (
            <div key={cr.label} style={{ display: "flex", alignItems: "center", gap: 11, background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: "11px 13px" }}>
              <Ms name={cr.icon} size={19} color="var(--ink-600)" />
              <div>
                <div style={{ fontSize: 10.5, color: "var(--ink-400)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".03em" }}>{cr.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)" }}>{cr.value}</div>
              </div>
            </div>
          ))}
        </div>
        </>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 30,
            padding: "16px 18px",
            borderRadius: 14,
            background: "var(--paper-50)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Ms name="link" size={18} color="var(--ink-600)" />
            <a href={c.sourceHref} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600, color: "var(--teal-700)" }}>
              {c.sourceLink}
            </a>
            <span style={{ fontSize: 11.5, color: "var(--ink-400)" }}>· güncelleme {c.updated}</span>
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
            background: "linear-gradient(160deg,var(--terracotta-600),var(--terracotta-700))",
            color: "#fff",
            fontSize: 14.5,
            fontWeight: 700,
            boxShadow: "0 8px 20px rgba(168,80,46,.28)",
          }}
        >
          <Ms name={c.eligIconName} size={20} />
          Uygunluğumu kontrol et
        </button>

        {onViewReportRequirements && (
          <button
            onClick={onViewReportRequirements}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              marginTop: 10,
              padding: "12px 0",
              borderRadius: 13,
              background: "var(--surface)",
              border: "1.5px solid var(--border-subtle)",
              color: "var(--ink-900)",
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            <Ms name="fact_check" size={18} color="var(--ink-600)" />
            Rapor gereksinimlerini gör
          </button>
        )}
      </div>
    </section>
  );
}