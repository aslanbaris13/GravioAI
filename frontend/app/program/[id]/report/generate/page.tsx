"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Ms from "@/components/Ms";
import ProgramNotFound from "@/components/ProgramNotFound";
import { resolveReportSchema, generateReport, exportReportDocx, ApiError } from "@/lib/api";
import type { BackendReportSchema, BackendGeneratedReport, ReportFieldValues } from "@/lib/api";
import { useAppState } from "@/lib/AppStateContext";

type LoadState = "loading" | "found" | "not-found" | "error";
type SubmitState = "idle" | "submitting" | "done" | "error";

export default function ProgramReportGeneratePage() {
  const { id } = useParams<{ id: string }>();
  const { resolveProgram, goToMatches, goToReport, currentProfile } = useAppState();
  const program = resolveProgram(id);

  const [schema, setSchema] = useState<BackendReportSchema | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [values, setValues] = useState<ReportFieldValues>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState("");
  const [report, setReport] = useState<BackendGeneratedReport | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!program) return;
    let cancelled = false;
    resolveReportSchema(program.name)
      .then((result) => {
        if (cancelled) return;
        setSchema(result);
        setLoadState(result ? "found" : "not-found");
      })
      .catch(() => {
        if (!cancelled) setLoadState("error");
      });
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!program) return <ProgramNotFound onBack={goToMatches} />;

  function setFieldValue(sectionId: string, fieldKey: string, value: string) {
    setValues((prev) => ({
      ...prev,
      [sectionId]: { ...(prev[sectionId] ?? {}), [fieldKey]: value },
    }));
  }

  async function onSubmit() {
    if (!schema) return;
    setSubmitState("submitting");
    setSubmitError("");
    try {
      const result = await generateReport(schema.key, currentProfile ?? { goals: [] }, values);
      setReport(result);
      setSubmitState("done");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Beklenmeyen bir hata oluştu.";
      setSubmitError(msg);
      setSubmitState("error");
    }
  }

  async function onDownloadDocx() {
    if (!report) return;
    setDownloading(true);
    try {
      const blob = await exportReportDocx(report);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.program_name.replace(/\s+/g, "-")}-Rapor.docx`;
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
          onClick={() => goToReport(id)}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#5a6b75", fontWeight: 600, marginBottom: 18 }}
        >
          <Ms name="arrow_back" size={17} />
          Gereksinimlere dön
        </button>

        <h1 style={{ fontSize: 21, fontWeight: 700, color: "#14222c", margin: "0 0 4px", letterSpacing: "-.01em" }}>
          Rapor hazırla
        </h1>
        <p style={{ fontSize: 13.5, color: "#5a6b75", margin: "0 0 24px" }}>{program.name}</p>

        {loadState === "loading" && <Info icon="hourglass_empty" text="Yükleniyor…" />}
        {loadState === "error" && <Info icon="cloud_off" text="Sunucuya ulaşılamadı." tone="warn" />}
        {loadState === "not-found" && (
          <Info icon="construction" text="Bu program için henüz hazır bir rapor şablonu yok." />
        )}

        {loadState === "found" && schema && submitState !== "done" && (
          <>
            <p style={{ fontSize: 12.5, color: "#8a96a0", margin: "0 0 18px" }}>
              Her bölüm için elindeki bilgiyi kısaca yaz — Gravio bunları resmi rapor diline çevirecek.
              Boş bıraktığın alanlar raporda açıkça işaretlenir, uydurulmaz.
            </p>

            {schema.sections.map((section, i) => (
              <div key={section.id} style={{ background: "#fff", border: "1px solid #e7e4dc", borderRadius: 12, padding: "16px 18px", marginBottom: 12 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#14222c", marginBottom: 10 }}>
                  {i + 1}. {section.title}
                </div>
                {section.required_fields.map((f) => (
                  <div key={f.key} style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: "#5a6b75", display: "block", marginBottom: 5 }}>
                      {f.label}
                    </label>
                    {f.long_text ? (
                      <textarea
                        value={values[section.id]?.[f.key] ?? ""}
                        onChange={(e) => setFieldValue(section.id, f.key, e.target.value)}
                        rows={3}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #e7e4dc", fontSize: 13.5, fontFamily: "inherit", resize: "vertical" }}
                      />
                    ) : (
                      <input
                        value={values[section.id]?.[f.key] ?? ""}
                        onChange={(e) => setFieldValue(section.id, f.key, e.target.value)}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #e7e4dc", fontSize: 13.5 }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}

            {submitState === "error" && (
              <Info icon="error" text={submitError || "Rapor oluşturulamadı, tekrar dene."} tone="warn" />
            )}

            <button
              onClick={onSubmit}
              disabled={submitState === "submitting"}
              style={{
                width: "100%",
                marginTop: 8,
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
              {submitState === "submitting" ? "Oluşturuluyor…" : "Raporu oluştur"}
            </button>
          </>
        )}

        {submitState === "done" && report && (
          <>
            <div style={{ background: "#fff", border: "1px solid #e7e4dc", borderRadius: 12, padding: "18px 20px", marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#14222c", margin: "0 0 4px" }}>{report.title}</h2>
            </div>
            {report.sections.map((s) => (
              <div key={s.section_id} style={{ background: "#fff", border: "1px solid #e7e4dc", borderRadius: 12, padding: "16px 18px", marginBottom: 12 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#14222c", marginBottom: 8 }}>{s.heading}</div>
                <p style={{ fontSize: 13, color: "#414f57", lineHeight: 1.65, margin: 0, whiteSpace: "pre-wrap" }}>{s.body}</p>
              </div>
            ))}
            <button
              onClick={onDownloadDocx}
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
              {downloading ? "İndiriliyor…" : "DOCX olarak indir"}
            </button>
          </>
        )}
      </div>
    </section>
  );
}

function Info({ icon, text, tone = "neutral" }: { icon: string; text: string; tone?: "neutral" | "warn" }) {
  const bg = tone === "warn" ? "#fdf6e8" : "#fff";
  const border = tone === "warn" ? "#f0e0b8" : "#e7e4dc";
  const color = tone === "warn" ? "#7a5f1e" : "#5a6b75";
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "16px 18px", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 16 }}>
      <Ms name={icon} size={19} color={color} style={{ marginTop: 1, flexShrink: 0 }} />
      <p style={{ fontSize: 13, color, margin: 0, lineHeight: 1.55 }}>{text}</p>
    </div>
  );
}
