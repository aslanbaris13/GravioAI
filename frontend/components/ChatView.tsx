"use client";
import { useEffect, useRef } from "react";
import Ms from "./Ms";
import { toVM } from "@/lib/viewmodel";
import { getProgram } from "@/lib/programs";
import type { ChatMessage, FollowUp } from "@/lib/types";

const SUGGESTIONS: { key: string; icon: string; label: string }[] = [
  { key: "profile", icon: "storefront", label: "Düzce'de yeni bir AI yazılım girişimi kurdum, 3 kişiyiz" },
  { key: "cloud", icon: "cloud", label: "Bulut altyapısı için kredi arıyorum" },
  { key: "arge", icon: "science", label: "Ar-Ge hibesine uygun muyum?" },
  { key: "all", icon: "auto_awesome", label: "Yeni şirketim için tüm destekleri göster" },
];

export default function ChatView({
  messages,
  typing,
  input,
  onInput,
  onSend,
  followups,
  onFollowup,
  onSuggestion,
  onNavMatches,
  onOpenProgram,
  onApplyProgram,
  onCtaAction,
}: {
  messages: ChatMessage[];
  typing: boolean;
  input: string;
  onInput: (v: string) => void;
  onSend: () => void;
  followups: FollowUp[];
  onFollowup: (key: string) => void;
  onSuggestion: (key: string) => void;
  onNavMatches: () => void;
  onOpenProgram: (id: string) => void;
  onApplyProgram: (id: string) => void;
  onCtaAction: (action: "go-matches" | "apply-bigg") => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const showEmpty = messages.length === 0 && !typing;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  return (
    <section data-screen-label="Sohbet" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "15px 26px",
          borderBottom: "1px solid #e7e4dc",
          background: "#fbfaf7",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "linear-gradient(140deg,#f97316,#ea580c)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ms name="radar" size={19} color="#fff" />
        </div>
        <div style={{ lineHeight: 1.15 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: "#14222c" }}>Gravio Asistan</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "#5b8a3c" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22a447", display: "inline-block" }} />
            Çevrimiçi · destek evrenini tarıyor
          </div>
        </div>
        <button
          onClick={onNavMatches}
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12.5,
            fontWeight: 600,
            color: "#5a6b75",
            padding: "7px 12px",
            borderRadius: 9,
            border: "1px solid #e3e0d8",
          }}
        >
          <Ms name="grid_view" size={17} />
          Eşleşmeleri gör
        </button>
      </header>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "0 0 8px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
          {showEmpty && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "66px 0 20px" }}>
              <div
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: 18,
                  background: "linear-gradient(140deg,#f97316,#ea580c)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 10px 30px rgba(234,88,12,.3)",
                }}
              >
                <Ms name="radar" size={34} color="#fff" />
              </div>
              <h1 style={{ fontSize: 27, fontWeight: 700, letterSpacing: "-.025em", margin: "22px 0 0", color: "#14222c" }}>
                Yüzeyin altındaki fırsatı çıkaralım.
              </h1>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: "#5a6b75", maxWidth: 500, margin: "13px 0 0" }}>
                İşletmeni birkaç cümleyle anlat — sana uygun devlet ve özel sektör desteklerini bulayım, uygunluğunu
                kontrol edip başvurunu hazırlayayım. Form yok, sadece sohbet.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", maxWidth: 580, marginTop: 34 }}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => onSuggestion(s.key)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 11,
                      textAlign: "left",
                      padding: "15px 16px",
                      borderRadius: 14,
                      background: "#fff",
                      border: "1px solid #e7e4dc",
                      boxShadow: "0 1px 2px rgba(20,34,44,.04)",
                    }}
                  >
                    <Ms name={s.icon} size={20} color="#f97316" style={{ marginTop: 1 }} />
                    <span style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.45, color: "#27353e" }}>{s.label}</span>
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 26, fontSize: 12, color: "#8a96a0" }}>
                <Ms name="verified_user" size={16} color="#22a447" />
                Önerilerin tümü resmî kaynaklara dayanır ve "son güncelleme" tarihiyle gösterilir.
              </div>
            </div>
          )}

          <div style={{ paddingTop: 22 }}>
            {messages.map((m) => (
              <MessageRow
                key={m.id}
                m={m}
                onOpenProgram={onOpenProgram}
                onApplyProgram={onApplyProgram}
                onCtaAction={onCtaAction}
              />
            ))}

            {typing && (
              <div style={{ display: "flex", gap: 11, marginTop: 14 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 9,
                    flexShrink: 0,
                    background: "linear-gradient(140deg,#f97316,#ea580c)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ms name="radar" size={17} color="#fff" />
                </div>
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid #ebe8e0",
                    padding: "15px 17px",
                    borderRadius: "4px 16px 16px 16px",
                    display: "flex",
                    gap: 5,
                    alignItems: "center",
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f97316", animation: "blink 1.2s infinite 0s" }} />
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f97316", animation: "blink 1.2s infinite .2s" }} />
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f97316", animation: "blink 1.2s infinite .4s" }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: "8px 24px 18px", background: "linear-gradient(0deg,#fbfaf7 65%,rgba(251,250,247,0))" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {followups.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
              {followups.map((f) => (
                <button
                  key={f.key}
                  onClick={() => onFollowup(f.key)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: "#27353e",
                    background: "#fff",
                    border: "1px solid #e3e0d8",
                    padding: "8px 13px",
                    borderRadius: 999,
                  }}
                >
                  <Ms name="bolt" size={16} color="#f97316" />
                  {f.label}
                </button>
              ))}
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 10,
              background: "#fff",
              border: "1.5px solid #e0ddd4",
              borderRadius: 16,
              padding: "8px 8px 8px 18px",
              boxShadow: "0 2px 12px rgba(20,34,44,.06)",
            }}
          >
            <input
              value={input}
              onChange={(e) => onInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSend();
                }
              }}
              placeholder="İşletmeni anlat ya da bir soru sor…"
              style={{ flex: 1, border: "none", outline: "none", fontSize: 14.5, color: "#14222c", background: "transparent", padding: "8px 0" }}
            />
            <button
              onClick={onSend}
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                background: "linear-gradient(160deg,#f97316,#ea580c)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 4px 12px rgba(234,88,12,.3)",
              }}
            >
              <Ms name="arrow_upward" size={20} color="#fff" />
            </button>
          </div>
          <div style={{ textAlign: "center", fontSize: 11, color: "#a0aab2", marginTop: 9 }}>
            Gravio resmî kaynaklara dayanır. Başvuru göndermeden önce bilgileri doğrula.
          </div>
        </div>
      </div>
    </section>
  );
}

function MessageRow({
  m,
  onOpenProgram,
  onApplyProgram,
  onCtaAction,
}: {
  m: ChatMessage;
  onOpenProgram: (id: string) => void;
  onApplyProgram: (id: string) => void;
  onCtaAction: (action: "go-matches" | "apply-bigg") => void;
}) {
  const rowStyle = {
    display: "flex",
    justifyContent: m.role === "user" ? "flex-end" : "flex-start",
    marginTop: 14,
    animation: "bubbleIn .38s ease both",
    animationDelay: `${("delay" in m && m.delay) || 0}ms`,
  } as const;

  if (m.role === "user") {
    return (
      <div style={rowStyle}>
        <div
          style={{
            maxWidth: "74%",
            background: "linear-gradient(160deg,#13384e,#0f2a3c)",
            color: "#eef4f7",
            padding: "12px 16px",
            borderRadius: "16px 16px 4px 16px",
            fontSize: 14,
            lineHeight: 1.55,
            boxShadow: "0 2px 8px rgba(15,42,60,.18)",
          }}
        >
          {m.text}
        </div>
      </div>
    );
  }

  if (m.kind === "text") {
    return (
      <div style={rowStyle}>
        <div style={{ display: "flex", gap: 11, maxWidth: "88%" }}>
          <AssistantAvatar />
          <div
            style={{
              background: "#fff",
              border: "1px solid #ebe8e0",
              padding: "12px 16px",
              borderRadius: "4px 16px 16px 16px",
              fontSize: 14,
              lineHeight: 1.6,
              color: "#27353e",
              boxShadow: "0 1px 2px rgba(20,34,44,.04)",
            }}
          >
            {m.text}
          </div>
        </div>
      </div>
    );
  }

  if (m.kind === "profile") {
    return (
      <div style={rowStyle}>
        <div
          style={{
            marginLeft: 41,
            maxWidth: "88%",
            background: "#fff",
            border: "1px solid #ebe8e0",
            borderRadius: 14,
            padding: "14px 16px",
            boxShadow: "0 1px 2px rgba(20,34,44,.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, color: "#76858d", marginBottom: 12 }}>
            <Ms name="badge" size={16} color="#0f6ea8" />
            Çıkarılan işletme profili
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {m.chips.map((ch) => (
              <div
                key={ch.label}
                style={{ display: "flex", flexDirection: "column", gap: 1, padding: "7px 12px", borderRadius: 10, background: "#f6f5f1", border: "1px solid #ebe8e0" }}
              >
                <span style={{ fontSize: 10, fontWeight: 600, color: "#97a2aa", textTransform: "uppercase", letterSpacing: ".04em" }}>{ch.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#27353e" }}>{ch.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (m.kind === "cards") {
    return (
      <div style={rowStyle}>
        <div style={{ marginLeft: 41, width: "calc(100% - 41px)", display: "flex", flexDirection: "column", gap: 10 }}>
          {m.programIds.map((id) => {
            const c = toVM(getProgram(id));
            return (
              <button
                key={id}
                onClick={() => onOpenProgram(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  textAlign: "left",
                  background: "#fff",
                  border: "1px solid #ebe8e0",
                  borderRadius: 14,
                  padding: "13px 15px",
                  boxShadow: "0 1px 2px rgba(20,34,44,.04)",
                }}
              >
                <div style={c.iconWrapStyle}>
                  <Ms name={c.icon} size={21} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#14222c" }}>{c.name}</span>
                    <span style={c.eligBadgeStyle}>
                      <Ms name={c.eligIconName} size={14} />
                      {c.eligLabel}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "#8a96a0" }}>
                    {c.org} · {c.typeLabel}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#ea580c", fontVariantNumeric: "tabular-nums" }}>{c.amountDisplayText}</div>
                  <div style={{ fontSize: 10.5, color: "#97a2aa", fontWeight: 600 }}>{c.amountSub}</div>
                </div>
                <Ms name="chevron_right" size={20} color="#c2bdb1" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (m.kind === "cta") {
    return (
      <div style={rowStyle}>
        <div style={{ marginLeft: 41 }}>
          <button
            onClick={() => onCtaAction(m.action)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "linear-gradient(160deg,#f97316,#ea580c)",
              color: "#fff",
              fontSize: 13.5,
              fontWeight: 600,
              padding: "11px 18px",
              borderRadius: 11,
              boxShadow: "0 6px 16px rgba(234,88,12,.28)",
            }}
          >
            {m.label}
            <Ms name={m.icon} size={18} />
          </button>
        </div>
      </div>
    );
  }

  // note
  return (
    <div style={rowStyle}>
      <div style={{ marginLeft: 41, display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#8a96a0", padding: "2px 0" }}>
        <Ms name="verified_user" size={16} color="#22a447" />
        {m.text}
      </div>
    </div>
  );
}

function AssistantAvatar() {
  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: 9,
        flexShrink: 0,
        background: "linear-gradient(140deg,#f97316,#ea580c)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 1,
      }}
    >
      <Ms name="radar" size={17} color="#fff" />
    </div>
  );
}
