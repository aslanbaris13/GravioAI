"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Ms from "./Ms";
import { WIDGET_DRAFT_KEY } from "@/lib/AppStateContext";

const SUGGESTIONS = [
  "Hangi destekler bana uygun?",
  "KOSGEB hibesine nasıl başvururum?",
  "Hibe oranları nasıl hesaplanıyor?",
];

const DEFAULT_POS = { right: 28, bottom: 28 };

/**
 * Sağ altta duran destek widget'ı — sayfa yüklendiğinde otomatik açık
 * gelir (kullanıcı tıklamak zorunda kalmaz). Başlık şeridi bilerek açık
 * turuncu/terracotta tonunda: koyu teal zemin logodaki roket markasını
 * gölgede bırakıyordu, açık zeminde marka rengi çok daha net okunuyor.
 *
 * Sürüklenebilir: kapalıyken roket rozetinden, açıkken başlık şeridinden
 * tutup ekranda istenen yere taşınabilir. Basit bir tıklama, sürükleme
 * sayılmaz (4px eşik) — böylece kapalı rozete tıklamak hâlâ paneli açar.
 */
export default function ChatWidget() {
  const [open, setOpen] = useState(true);
  const [value, setValue] = useState("");
  const [pos, setPos] = useState(DEFAULT_POS);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startRight: number; startBottom: number; moved: boolean } | null>(null);
  const router = useRouter();

  const goToChat = (message?: string) => {
    if (message) {
      try {
        window.localStorage.setItem(WIDGET_DRAFT_KEY, message);
      } catch {
        /* depolama kapalıysa sorun değil, mesajsız da yönlendirir */
      }
    }
    router.push("/chat");
  };

  const onDragPointerDown = (e: React.PointerEvent) => {
    // Yalnızca birincil düğme (sol tık / tek dokunuş) sürüklemeyi başlatsın.
    if (e.button !== 0) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, startRight: pos.right, startBottom: pos.bottom, moved: false };
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onDragPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    // `dragging` kontrolü şart: pointerup'tan sonra dragRef bir sonraki
    // tıklamanın "sürükleme miydi" sorusu için kısa süre canlı tutuluyor,
    // ama o aralıkta imleç hareketi paneli taşımamalı.
    if (!d || !dragging) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.moved = true;
    if (!d.moved) return;
    const maxRight = Math.max(window.innerWidth - 70, 0);
    const maxBottom = Math.max(window.innerHeight - 70, 0);
    setPos({
      right: Math.min(Math.max(d.startRight - dx, -20), maxRight),
      bottom: Math.min(Math.max(d.startBottom - dy, -20), maxBottom),
    });
  };

  const onDragPointerUp = (e: React.PointerEvent) => {
    setDragging(false);
    const el = e.currentTarget as HTMLElement;
    if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
  };

  const onCollapsedClick = () => {
    // Sürükleme sonrası gelen click yoksayılır (rozet yerine taşındı, açılmaz).
    const wasDrag = dragRef.current?.moved ?? false;
    dragRef.current = null;
    if (wasDrag) return;
    setOpen(true);
  };

  if (!open) {
    return (
      <button
        onClick={onCollapsedClick}
        onPointerDown={onDragPointerDown}
        onPointerMove={onDragPointerMove}
        onPointerUp={onDragPointerUp}
        onPointerCancel={onDragPointerUp}
        aria-label="Sohbeti aç"
        style={{
          position: "fixed",
          right: pos.right,
          bottom: pos.bottom,
          zIndex: 40,
          width: 84,
          height: 84,
          borderRadius: "50%",
          background: "linear-gradient(160deg,var(--terracotta-600),var(--terracotta-700))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 14px 32px rgba(168,80,46,.4)",
          cursor: dragging ? "grabbing" : "grab",
          touchAction: "none",
        }}
      >
        <span style={{ position: "absolute", inset: -3, borderRadius: "50%", border: "2.5px solid var(--teal-700)", animation: "widgetRing 2.2s ease-out infinite" }} />
        <span
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "var(--teal-700)",
            border: "2px solid var(--paper-100)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          1
        </span>
        <Ms name="rocket_launch" size={38} color="#fff" style={{ transform: "rotate(45deg)" }} />
      </button>
    );
  }

  return (
    <div
      className="chat-widget-panel"
      role="dialog"
      aria-label="GravioAI destek sohbeti"
      style={{
        position: "fixed",
        right: pos.right,
        bottom: pos.bottom,
        zIndex: 40,
        width: 430,
        maxHeight: "min(700px, 82vh)",
        display: "flex",
        flexDirection: "column",
        borderRadius: 22,
        overflow: "hidden",
        background: "var(--paper-50)",
        boxShadow: "0 24px 56px rgba(22,48,46,.22)",
        border: "1px solid var(--border-subtle)",
        animation: "widgetIn .22s ease",
      }}
    >
      {/* Başlık — açık mavi (teal) zemin, logo net görünür. Ton bilerek açık:
          koyu zemin logodaki roket markasını gölgede bırakıyor, başlık metni de
          okunmuyordu. Aynı zamanda sürükleme tutamacı: panel buradan taşınabilir. */}
      <div
        onPointerDown={onDragPointerDown}
        onPointerMove={onDragPointerMove}
        onPointerUp={onDragPointerUp}
        onPointerCancel={onDragPointerUp}
        style={{
          background: "linear-gradient(150deg,var(--teal-100),var(--teal-200))",
          borderBottom: "1px solid var(--border-subtle)",
          padding: "20px 22px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexShrink: 0,
          cursor: dragging ? "grabbing" : "grab",
          touchAction: "none",
          userSelect: "none",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
            <img src="/brand/gravio-mark.png" alt="" style={{ width: 26, height: "auto" }} draggable={false} />
            <span style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, color: "var(--ink-900)" }}>GravioAI</span>
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 700, color: "var(--ink-900)", lineHeight: 1.3 }}>
            Merhaba 👋
            <br />
            Size nasıl yardımcı olabilirim?
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Kapat"
          style={{ color: "var(--ink-600)", padding: 4, flexShrink: 0 }}
        >
          <Ms name="close" size={22} color="var(--ink-600)" />
        </button>
      </div>

      {/* Gövde */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 13 }}>
        <div
          style={{
            background: "var(--sand-200)",
            borderRadius: "4px 16px 16px 16px",
            padding: "13px 16px",
            fontSize: 14,
            color: "var(--ink-900)",
            lineHeight: 1.55,
          }}
        >
          Hoş geldin! Hangi devlet ya da özel sektör desteklerine uygun olduğunu
          birlikte bulalım.
        </div>
        <div
          style={{
            background: "var(--sand-200)",
            borderRadius: "4px 16px 16px 16px",
            padding: "13px 16px",
            fontSize: 12.5,
            color: "var(--ink-600)",
            lineHeight: 1.5,
          }}
        >
          Güvenliğin için kişisel/finansal bilgilerini bu widget üzerinden
          paylaşmana gerek yok — detaylı profil oluşturma adımı ayrı bir ekranda.
        </div>

        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-400)", margin: "8px 0 2px" }}>
          Sorabileceğin konular
        </div>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => goToChat(s)}
            style={{
              textAlign: "left",
              padding: "13px 16px",
              borderRadius: 13,
              border: "1px solid var(--border-subtle)",
              background: "var(--surface)",
              fontSize: 14,
              color: "var(--ink-900)",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 9,
            }}
          >
            <Ms name="chat_bubble" size={16} color="var(--terracotta-600)" />
            {s}
          </button>
        ))}

        <div style={{ fontSize: 12.5, color: "var(--ink-400)", marginTop: 4 }}>
          Daha fazlası için aşağıya kendi sorunu yazabilirsin.
        </div>
      </div>

      {/* Giriş */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) goToChat(value.trim());
        }}
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: 14,
          borderTop: "1px solid var(--border-subtle)",
          background: "var(--paper-50)",
        }}
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Mesajınızı buraya yazınız"
          style={{
            flex: 1,
            border: "1px solid var(--border-subtle)",
            borderRadius: 999,
            padding: "12px 16px",
            fontSize: 14,
            color: "var(--ink-900)",
            background: "var(--surface-strong)",
          }}
        />
        <button
          type="submit"
          aria-label="Gönder"
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            background: "var(--terracotta-600)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Ms name="send" size={19} color="#fff" />
        </button>
      </form>
    </div>
  );
}