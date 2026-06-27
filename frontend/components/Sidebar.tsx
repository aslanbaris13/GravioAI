"use client";
import type { CSSProperties } from "react";
import Ms from "./Ms";
import type { ViewName } from "@/lib/types";

function navStyle(active: boolean): CSSProperties {
  const base: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 11,
    width: "100%",
    padding: "10px 13px",
    borderRadius: 11,
    fontSize: 13.5,
    fontWeight: 600,
    textAlign: "left",
    transition: "background .15s,color .15s",
  };
  if (active) {
    return { ...base, background: "rgba(255,255,255,.09)", color: "#fff", boxShadow: "inset 3px 0 0 #f97316" };
  }
  return { ...base, background: "transparent", color: "#9fb3c0" };
}

export default function Sidebar({
  view,
  matchCount,
  onNewChat,
  onNavChat,
  onNavMatches,
  onNavProfile,
}: {
  view: ViewName;
  matchCount: number;
  onNewChat: () => void;
  onNavChat: () => void;
  onNavMatches: () => void;
  onNavProfile: () => void;
}) {
  const matchActive = view === "matches" || view === "detail" || view === "eligibility" || view === "application";

  return (
    <aside
      style={{
        width: 256,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(177deg,#0d2a3c 0%,#0a1f2d 100%)",
        color: "#c6d3db",
        padding: "18px 14px",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "6px 8px 16px" }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: "linear-gradient(140deg,#f97316,#ea580c)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(234,88,12,.35)",
          }}
        >
          <Ms name="radar" size={22} color="#fff" />
        </div>
        <div style={{ lineHeight: 1.05 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-.02em" }}>GravioAI</div>
          <div style={{ fontSize: 10.5, color: "#7d93a1", fontWeight: 500, marginTop: 2 }}>Fırsat asistanı</div>
        </div>
      </div>

      <button
        onClick={onNewChat}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          width: "100%",
          padding: "11px 13px",
          borderRadius: 11,
          background: "rgba(249,115,22,.14)",
          border: "1px solid rgba(249,115,22,.32)",
          color: "#ffb27a",
          fontSize: 13.5,
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        <Ms name="add" size={19} />
        Yeni sohbet
      </button>

      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          color: "#5f7686",
          textTransform: "uppercase",
          letterSpacing: ".07em",
          padding: "6px 10px 4px",
        }}
      >
        Çalışma alanı
      </div>

      <button onClick={onNavChat} style={navStyle(view === "chat")}>
        <Ms name="forum" size={20} />
        <span>Sohbet</span>
      </button>
      <button onClick={onNavMatches} style={navStyle(matchActive)}>
        <Ms name="auto_awesome" size={20} />
        <span>Eşleşmelerim</span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 11,
            fontWeight: 700,
            background: "rgba(249,115,22,.2)",
            color: "#ffb27a",
            padding: "1px 8px",
            borderRadius: 999,
          }}
        >
          {matchCount}
        </span>
      </button>
      <button onClick={onNavProfile} style={navStyle(view === "dashboard")}>
        <Ms name="dashboard" size={20} />
        <span>Panelim</span>
      </button>

      <div style={{ flex: 1 }} />

      <div
        style={{
          padding: 11,
          borderRadius: 13,
          background: "rgba(255,255,255,.05)",
          border: "1px solid rgba(255,255,255,.07)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
          <Ms name="verified_user" size={17} color="#ffb27a" />
          <span style={{ fontSize: 11.5, fontWeight: 600, color: "#dce6ec" }}>Kaynak doğrulamalı</span>
        </div>
        <div style={{ fontSize: 11, lineHeight: 1.5, color: "#8499a6" }}>
          Her öneri resmî kaynağına bağlıdır. Kritik kararlarda bilgiyi doğrula.
        </div>
      </div>

      <button
        onClick={onNavProfile}
        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: 8, borderRadius: 12, marginTop: 6 }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "#1d4a63",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: "#9fd0e8",
            flexShrink: 0,
          }}
        >
          NA
        </div>
        <div style={{ textAlign: "left", lineHeight: 1.2, overflow: "hidden" }}>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: "#eaf1f5",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Nova AI Yazılım
          </div>
          <div style={{ fontSize: 10.5, color: "#7d93a1" }}>Düzce · 3 kişi</div>
        </div>
      </button>
    </aside>
  );
}
