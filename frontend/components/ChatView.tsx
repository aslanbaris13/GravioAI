"use client";
import { useEffect, useRef } from "react";
import Ms from "./Ms";
import { formatChatText } from "@/lib/formatChatText";
import { toVM } from "@/lib/viewmodel";
import type { ChatMessage, FollowUp, Program } from "@/lib/types";

const SUGGESTIONS: { key: string; icon: string; label: string }[] = [
  { key: "profile", icon: "storefront", label: "İşletmeni birkaç cümleyle tanıt: sektör, şehir, ekip büyüklüğü" },
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
  resolveProgram,
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
  resolveProgram: (id: string) => Program | null;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const showEmpty = messages.length === 0 && !typing;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  return (
    <section data-screen-label="Sohbet" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <header
        className="chat-header"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "15px 26px",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--paper-50)",
        }}
      >
        <img src="/brand/gravio-mark.png" alt="" style={{ width: 32, height: "auto", flexShrink: 0 }} />
        <div style={{ lineHeight: 1.15 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 14.5, fontWeight: 700, color: "var(--ink-900)" }}>
            Gravio Asistan
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--success-700)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--success-500)", display: "inline-block" }} />
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
            color: "var(--ink-600)",
            padding: "7px 12px",
            borderRadius: 9,
            border: "1px solid var(--border-subtle)",
          }}
        >
          <Ms name="grid_view" size={17} />
          Eşleşmeleri gör
        </button>
      </header>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "0 0 8px" }}>
        <div className="chat-scroll-padding" style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
          {showEmpty && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "66px 0 20px" }}>
              <img src="/brand/gravio-mark.png" alt="" style={{ width: 62, height: "auto", display: "block" }} />
              <h1 style={{ fontSize: 27, fontWeight: 700, letterSpacing: "-.025em", margin: "22px 0 0", color: "var(--ink-900)" }}>
                Yüzeyin altındaki fırsatı çıkaralım.
              </h1>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-600)", maxWidth: 500, margin: "13px 0 0" }}>
                İşletmeni birkaç cümleyle anlat — sana uygun devlet ve özel sektör desteklerini bulayım, uygunluğunu
                kontrol edip başvurunu hazırlayayım. Form yok, sadece sohbet.
              </p>

              <div
                className="chat-suggestions-grid"
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", maxWidth: 580, marginTop: 34 }}
              >
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
                      background: "var(--surface)",
                      border: "1px solid var(--border-subtle)",
                      boxShadow: "0 1px 2px rgba(22,48,46,.04)",
                    }}
                  >
                    <Ms name={s.icon} size={20} color="var(--terracotta-600)" style={{ marginTop: 1 }} />
                    <span>
                      <span style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.45, color: "var(--ink-900)" }}>{s.label}</span>
                      {/* "profile" bir soru/istek değil, bir yönerge — otomatik
                          gönderilmez, yalnızca yazı alanını doldurur. */}
                      {s.key === "profile" && (
                        <span style={{ display: "block", fontSize: 11, color: "var(--ink-400)", marginTop: 3 }}>
                          Yazı alanını doldurur, göndermez
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 26, fontSize: 12, color: "var(--ink-400)" }}>
                <Ms name="verified_user" size={16} color="var(--success-500)" />
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
                resolveProgram={resolveProgram}
              />
            ))}

          </div>
        </div>
      </div>

      <div className="chat-scroll-padding" style={{ padding: "8px 24px 18px", background: "linear-gradient(0deg,var(--paper-50) 65%,rgba(251,248,241,0))" }}>
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
                    color: "var(--ink-900)",
                    background: "var(--surface)",
                    border: "1px solid var(--border-subtle)",
                    padding: "8px 13px",
                    borderRadius: 999,
                  }}
                >
                  <Ms name="bolt" size={16} color="var(--terracotta-600)" />
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
              background: "var(--surface-strong)",
              border: "1.5px solid var(--border-subtle)",
              borderRadius: 16,
              padding: "8px 8px 8px 18px",
              boxShadow: "0 2px 12px rgba(22,48,46,.06)",
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
              style={{ flex: 1, border: "none", fontSize: 14.5, color: "var(--ink-900)", background: "transparent", padding: "8px 0" }}
            />
            <button
              onClick={onSend}
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                background: "linear-gradient(160deg,var(--terracotta-600),var(--terracotta-700))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 4px 12px rgba(168,80,46,.3)",
              }}
            >
              <Ms name="arrow_upward" size={20} color="#fff" />
            </button>
          </div>
          <div style={{ textAlign: "center", fontSize: 11, color: "var(--ink-400)", marginTop: 9 }}>
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
  resolveProgram,
}: {
  m: ChatMessage;
  onOpenProgram: (id: string) => void;
  onApplyProgram: (id: string) => void;
  onCtaAction: (action: "go-matches" | "apply-bigg") => void;
  resolveProgram: (id: string) => Program | null;
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
            background: "linear-gradient(160deg,var(--teal-800),var(--teal-900))",
            color: "var(--teal-100)",
            padding: "12px 16px",
            borderRadius: "16px 16px 4px 16px",
            fontSize: 14,
            lineHeight: 1.55,
            boxShadow: "0 2px 8px rgba(22,48,46,.18)",
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
              background: "var(--surface)",
              border: "1px solid var(--border-subtle)",
              padding: "12px 16px",
              borderRadius: "4px 16px 16px 16px",
              fontSize: 14,
              lineHeight: 1.6,
              color: "var(--ink-900)",
              boxShadow: "0 1px 2px rgba(22,48,46,.04)",
            }}
          >
            {formatChatText(m.text)}
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
            background: "var(--surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 14,
            padding: "14px 16px",
            boxShadow: "0 1px 2px rgba(22,48,46,.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 600, color: "var(--ink-600)", marginBottom: 12 }}>
            <Ms name="badge" size={16} color="var(--teal-700)" />
            Çıkarılan işletme profili
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {m.chips.map((ch) => (
              <div
                key={ch.label}
                style={{ display: "flex", flexDirection: "column", gap: 1, padding: "7px 12px", borderRadius: 10, background: "var(--paper-50)", border: "1px solid var(--border-subtle)" }}
              >
                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: ".04em" }}>{ch.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)" }}>{ch.value}</span>
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
            const program = resolveProgram(id);
            if (!program) return null;
            const c = toVM(program);
            return (
              <button
                key={id}
                onClick={() => onOpenProgram(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  textAlign: "left",
                  background: "var(--surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 14,
                  padding: "13px 15px",
                  boxShadow: "0 1px 2px rgba(22,48,46,.04)",
                }}
              >
                <div style={c.iconWrapStyle}>
                  <Ms name={c.icon} size={21} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-900)", minWidth: 0 }}>{c.name}</span>
                    <span style={c.eligBadgeStyle}>
                      <Ms name={c.eligIconName} size={14} />
                      {c.eligLabel}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-400)" }}>
                    {c.org} · {c.typeLabel}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "var(--terracotta-700)", fontVariantNumeric: "tabular-nums" }}>{c.amountDisplayText}</div>
                  <div style={{ fontSize: 10.5, color: "var(--ink-400)", fontWeight: 600 }}>{c.amountSub}</div>
                </div>
                <Ms name="chevron_right" size={20} color="var(--ink-400)" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // loading — API bekleme göstergesi
  if (m.kind === "loading") {
    return (
      <div style={rowStyle}>
        <div style={{ display: "flex", gap: 11, maxWidth: "88%" }}>
          <AssistantAvatar />
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-subtle)",
              padding: "15px 17px",
              borderRadius: "4px 16px 16px 16px",
              display: "flex",
              gap: 5,
              alignItems: "center",
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--terracotta-600)", animation: "blink 1.2s infinite 0s" }} />
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--terracotta-600)", animation: "blink 1.2s infinite .2s" }} />
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--terracotta-600)", animation: "blink 1.2s infinite .4s" }} />
          </div>
        </div>
      </div>
    );
  }

  // error
  if (m.kind === "error") {
    return (
      <div style={rowStyle}>
        <div style={{ display: "flex", gap: 11, maxWidth: "88%" }}>
          <AssistantAvatar />
          <div
            style={{
              background: "var(--danger-100)",
              border: "1px solid var(--danger-200)",
              padding: "12px 16px",
              borderRadius: "4px 16px 16px 16px",
              fontSize: 14,
              lineHeight: 1.6,
              color: "var(--danger-700)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Ms name="error_outline" size={18} color="var(--danger-500)" />
            {m.text}
          </div>
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
              background: "linear-gradient(160deg,var(--terracotta-600),var(--terracotta-700))",
              color: "#fff",
              fontSize: 13.5,
              fontWeight: 600,
              padding: "11px 18px",
              borderRadius: 11,
              boxShadow: "0 6px 16px rgba(168,80,46,.28)",
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
      <div style={{ marginLeft: 41, display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--ink-400)", padding: "2px 0" }}>
        <Ms name="verified_user" size={16} color="var(--success-500)" />
        {m.text}
      </div>
    </div>
  );
}

function AssistantAvatar() {
  return (
    <img
      src="/brand/gravio-mark.png"
      alt=""
      // alignSelf şart: flex öğeleri varsayılanda satır yüksekliğine esner,
      // uzun mesajlarda logo balonla birlikte dikey olarak geriliyordu.
      style={{ width: 28, height: "auto", flexShrink: 0, alignSelf: "flex-start", marginTop: 1 }}
    />
  );
}