"use client";
import { useEffect, useState } from "react";
import Ms from "@/components/Ms";
import ProgramLoading from "@/components/ProgramLoading";
import ProgramNotFound from "@/components/ProgramNotFound";
import { resolveReportSchema } from "@/lib/api";
import type { BackendReportSchema } from "@/lib/api";
import { useAppState } from "@/lib/AppStateContext";
import { useProgram } from "@/lib/useProgram";
import { useProgramId } from "@/lib/useProgramId";

type LoadState = "loading" | "found" | "not-found" | "error";

export default function ProgramReportPage() {
  const id = useProgramId();
  const { goToMatches, goToProgram, goToReportGenerate, currentProfile } = useAppState();
  const { program, state: programState } = useProgram(id);

  const [schema, setSchema] = useState<BackendReportSchema | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    if (!program) return;
    let cancelled = false;
    setState("loading");
    resolveReportSchema(program.name)
      .then((result) => {
        if (cancelled) return;
        setSchema(result);
        setState(result ? "found" : "not-found");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, program]);

  if (programState === "loading") return <ProgramLoading />;
  if (!program) return <ProgramNotFound onBack={goToMatches} />;

  return (
    <section style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "26px 32px 80px" }}>
        <button
          onClick={() => goToProgram(id)}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-600)", fontWeight: 600, marginBottom: 18 }}
        >
          <Ms name="arrow_back" size={17} />
          Geri
        </button>

        <h1 style={{ fontSize: 21, fontWeight: 700, color: "var(--ink-900)", margin: "0 0 4px", letterSpacing: "-.01em" }}>
          Rapor gereksinimleri
        </h1>
        <p style={{ fontSize: 13.5, color: "var(--ink-600)", margin: "0 0 24px" }}>{program.name}</p>

        {state === "loading" && <InfoCard icon="hourglass_empty" text="Gereksinimler kontrol ediliyor…" />}

        {state === "error" && (
          <InfoCard icon="cloud_off" text="Sunucuya ulaşılamadı. Az sonra tekrar dene." tone="warn" />
        )}

        {state === "not-found" && (
          <InfoCard
            icon="construction"
            text="Bu program için henüz hazır bir rapor gereksinim şablonu yok. Şu an yalnızca TÜBİTAK 1507 ve 1501 için hazır — ekibimiz diğer programları da ekliyor."
          />
        )}

        {state === "found" && schema && (
          <>
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 14,
                padding: "18px 20px",
                marginBottom: 22,
              }}
            >
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <Ms name="fact_check" size={20} color="var(--success-700)" style={{ marginTop: 1, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)", marginBottom: 4 }}>
                    {schema.program_name}
                  </div>
                  <p style={{ fontSize: 13, color: "var(--ink-600)", lineHeight: 1.55, margin: 0 }}>{schema.summary}</p>
                </div>
              </div>
            </div>

            <p style={{ fontSize: 12.5, color: "var(--ink-400)", margin: "0 0 14px" }}>
              Aşağıdakiler resmi başvuru raporunun bölümleri ve her bölümde istenenler — rapor yazımına başlamadan
              önce ne hazırlaman gerektiğini görebilmen için.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {schema.sections.map((section, i) => (
                <div
                  key={section.id}
                  style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: "16px 18px" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink-900)" }}>
                      {i + 1}. {section.title}
                    </div>
                    {section.char_limit && (
                      <span style={{ fontSize: 11, color: "var(--ink-400)", fontWeight: 600 }}>
                        maks. {section.char_limit.toLocaleString("tr-TR")} karakter
                      </span>
                    )}
                  </div>
                  {section.description && (
                    <p style={{ fontSize: 12.5, color: "var(--ink-600)", margin: "0 0 10px", lineHeight: 1.5 }}>
                      {section.description}
                    </p>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {section.required_fields.map((f) => {
                      const prefilled =
                        f.prefillable_from_profile != null &&
                        currentProfile != null &&
                        (currentProfile as unknown as Record<string, unknown>)[f.prefillable_from_profile] != null;
                      return (
                        <div key={f.key} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <Ms
                            name={prefilled ? "check_circle" : "radio_button_unchecked"}
                            size={16}
                            color={prefilled ? "var(--success-700)" : "var(--border-subtle)"}
                            style={{ marginTop: 1, flexShrink: 0 }}
                          />
                          <div>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-900)" }}>
                              {f.label}
                              {prefilled && (
                                <span style={{ marginLeft: 6, fontSize: 10.5, color: "var(--success-700)", fontWeight: 700 }}>
                                  PROFİLİNDEN DOLDU
                                </span>
                              )}
                            </div>
                            {f.description && (
                              <div style={{ fontSize: 11.5, color: "var(--ink-400)" }}>{f.description}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: "16px 18px", marginTop: 12 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink-900)", marginBottom: 8 }}>Ek belgeler</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {schema.required_documents.map((doc) => (
                  <div key={doc} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Ms name="description" size={16} color="var(--ink-400)" />
                    <span style={{ fontSize: 12.5, color: "var(--ink-900)" }}>{doc}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => goToReportGenerate(id)}
              style={{
                width: "100%",
                marginTop: 20,
                padding: "13px 0",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(160deg,var(--terracotta-600),var(--terracotta-700))",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Ms name="auto_awesome" size={18} />
              Rapor hazırlamaya başla
            </button>
          </>
        )}
      </div>
    </section>
  );
}

function InfoCard({ icon, text, tone = "neutral" }: { icon: string; text: string; tone?: "neutral" | "warn" }) {
  const bg = tone === "warn" ? "var(--warn-100)" : "var(--surface)";
  const border = tone === "warn" ? "var(--warn-200)" : "var(--border-subtle)";
  const color = tone === "warn" ? "var(--warn-700)" : "var(--ink-600)";
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "16px 18px", display: "flex", gap: 10, alignItems: "flex-start" }}>
      <Ms name={icon} size={19} color={color} style={{ marginTop: 1, flexShrink: 0 }} />
      <p style={{ fontSize: 13, color, margin: 0, lineHeight: 1.55 }}>{text}</p>
    </div>
  );
}
