"use client";
import Ms from "./Ms";
import { eligRingStyle, eligHeadline, eligCta, CONDITION_STYLE } from "@/lib/viewmodel";
import type { Program } from "@/lib/types";

export default function EligibilityView({
  program,
  onBack,
  onPrimaryAction,
}: {
  program: Program;
  onBack: () => void;
  onPrimaryAction: () => void;
}) {
  const { state, score } = program.elig;
  const cta = eligCta(state);

  return (
    <section data-screen-label="Uygunluk kontrolü" style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "26px 32px 60px" }}>
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#5a6b75", marginBottom: 18 }}
        >
          <Ms name="arrow_back" size={18} />
          Program detayına dön
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 18, background: "#fff", border: "1px solid #e7e4dc", borderRadius: 16, padding: 20 }}>
          <div style={eligRingStyle(state, score)}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
              }}
            >
              <span style={{ fontSize: 17, fontWeight: 800, color: "#14222c" }}>{score}%</span>
            </div>
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "#14222c", margin: 0 }}>{eligHeadline(state)}</h1>
            <div style={{ fontSize: 13, color: "#8a96a0", marginTop: 4 }}>{program.name}</div>
          </div>
        </div>

        <h2 style={{ fontSize: 13, fontWeight: 700, color: "#76858d", textTransform: "uppercase", letterSpacing: ".05em", marginTop: 28 }}>
          Koşullar
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          {program.conditions.map((cond) => {
            const s = CONDITION_STYLE[cond.state];
            return (
              <div
                key={cond.text}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 13,
                  background: s.bg,
                  border: `1px solid ${s.bd}`,
                  borderRadius: 13,
                  padding: "14px 15px",
                }}
              >
                <Ms name={s.icon} size={20} color={s.col} style={{ marginTop: 1 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: "#27353e" }}>{cond.text}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: s.tagBg, color: s.tagFg, whiteSpace: "nowrap" }}>
                      {s.tag}
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "#76858d", marginTop: 3 }}>{cond.value}</div>
                  {cond.hint && (
                    <div style={{ fontSize: 12, color: s.col, marginTop: 7, lineHeight: 1.5, background: "rgba(255,255,255,.6)", padding: "8px 10px", borderRadius: 9 }}>
                      <Ms name="lightbulb" size={14} style={{ marginRight: 5, verticalAlign: -2 }} />
                      {cond.hint}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 26, padding: "16px 18px", background: "#fbfaf7", border: "1px solid #ebe8e0", borderRadius: 14 }}>
          <Ms name={cta.icon} size={22} color="#ea580c" />
          <p style={{ flex: 1, fontSize: 13.5, lineHeight: 1.55, color: "#414f57", margin: 0 }}>{cta.text}</p>
        </div>

        <button
          onClick={onPrimaryAction}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 9,
            width: "100%",
            marginTop: 18,
            padding: "14px 0",
            borderRadius: 13,
            background: "linear-gradient(160deg,#f97316,#ea580c)",
            color: "#fff",
            fontSize: 14.5,
            fontWeight: 700,
            boxShadow: "0 8px 20px rgba(234,88,12,.28)",
          }}
        >
          {cta.btn}
          <Ms name="arrow_forward" size={19} />
        </button>
      </div>
    </section>
  );
}
