"use client";
import type { CSSProperties } from "react";
import { usePathname } from "next/navigation";
import Ms from "./Ms";
import { formatRelativeTime, profileInitials } from "@/lib/adapter";
import type { BackendChatThreadSummary, BackendUserProfile } from "@/lib/api";

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
    return { ...base, background: "rgba(255,255,255,.09)", color: "#fff", boxShadow: "inset 3px 0 0 var(--terracotta-600)" };
  }
  return { ...base, background: "transparent", color: "var(--on-dark-muted)" };
}

export default function Sidebar({
  matchCount,
  applicationCount,
  open,
  onNewChat,
  onNavChat,
  onNavMatches,
  onNavApplications,
  onNavProfile,
  onNavHome,
  onNavLogin,
  onSignOut,
  userEmail,
  collapsed,
  onCollapse,
  profile,
  threads,
  activeThreadId,
  onOpenThread,
}: {
  matchCount: number;
  applicationCount: number;
  open: boolean;
  /** Masaüstünde daraltılmış mı — CSS bu sınıfa göre paneli gizler. */
  collapsed?: boolean;
  /** Verilmezse daraltma düğmesi hiç çizilmez. */
  onCollapse?: () => void;
  onNewChat: () => void;
  onNavChat: () => void;
  onNavMatches: () => void;
  onNavApplications: () => void;
  onNavProfile: () => void;
  onNavHome: () => void;
  onNavLogin: () => void;
  onSignOut: () => void;
  userEmail: string | null;
  profile: BackendUserProfile | null;
  threads: BackendChatThreadSummary[];
  activeThreadId: string | null;
  onOpenThread: (threadId: string) => void;
}) {
  const pathname = usePathname();
  const chatActive = pathname === "/chat";
  const matchActive = pathname.startsWith("/matches") || pathname.startsWith("/program");
  const applicationsActive = pathname.startsWith("/applications");
  const profileActive = pathname === "/panel";

  const companyName = profile?.company_name ?? null;
  const sector = profile?.sector ?? null;
  const city = profile?.city ?? null;
  const teamSize = profile?.team_size ?? null;
  const initials = profileInitials(profile);
  const title = companyName ?? sector ?? "İşletmem";
  // Şirket adı zaten başlıkta gösterildiği için sektörü tekrar etmiyoruz;
  // yalnızca companyName yokken sektör bir alt bilgi olarak anlamlı kalır.
  const metaParts = [
    companyName ? null : sector,
    city,
    teamSize ? `${teamSize} kişi` : null,
  ].filter(Boolean);
  const meta = metaParts.length > 0 ? metaParts.join(" · ") : "Profil bilgisi eksik";

  return (
    <aside
      className={`sidebar${open ? " sidebar-open" : ""}${collapsed ? " sidebar-collapsed" : ""}`}
      style={{
        width: 256,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(177deg,var(--teal-800) 0%,var(--teal-900) 100%)",
        color: "var(--on-dark)",
        padding: "18px 14px",
        gap: 6,
      }}
    >
      {/* Ana sayfayla aynı marka işareti — jenerik ikon yerine logo. */}
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "6px 8px 16px" }}>
        {/* Logo ana sayfaya döner. Daraltma düğmesi kardeş olarak kalıyor —
            buton içine buton yuvalanamaz. */}
        <button
          onClick={onNavHome}
          aria-label="Ana sayfaya git"
          title="Ana sayfa"
          style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0, padding: 0, textAlign: "left" }}
        >
          <img src="/brand/gravio-mark.png" alt="" style={{ width: 34, height: "auto", flexShrink: 0 }} />
          <div style={{ lineHeight: 1.05, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-.02em" }}>
              GravioAI
            </div>
            <div style={{ fontSize: 10.5, color: "var(--on-dark-faint)", fontWeight: 500, marginTop: 2 }}>Fırsat asistanı</div>
          </div>
        </button>
        {/* Daraltma yalnızca masaüstünde anlamlı — mobilde panel zaten
            off-canvas ve hamburger/backdrop ile kapanıyor (bkz. globals.css). */}
        {onCollapse && (
          <button
            className="sidebar-collapse-btn"
            onClick={onCollapse}
            aria-label="Menüyü daralt"
            title="Menüyü daralt"
            style={{
              marginLeft: "auto",
              width: 30,
              height: 30,
              borderRadius: 9,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--on-dark-muted)",
              flexShrink: 0,
            }}
          >
            <Ms name="dock_to_right" size={18} />
          </button>
        )}
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
          background: "rgba(201,106,70,.14)",
          border: "1px solid rgba(201,106,70,.32)",
          color: "var(--terracotta-400)",
          fontSize: 13.5,
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        <Ms name="add" size={19} />
        Yeni sohbet
      </button>

      {threads.length > 0 && (
        <>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              color: "var(--on-dark-faint)",
              textTransform: "uppercase",
              letterSpacing: ".07em",
              padding: "6px 10px 4px",
            }}
          >
            Sohbetlerim
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 168, overflowY: "auto", marginBottom: 4 }}>
            {threads.map((t) => {
              const active = t.id === activeThreadId;
              return (
                <button
                  key={t.id}
                  onClick={() => onOpenThread(t.id)}
                  title={t.title ?? "Yeni sohbet"}
                  style={{
                    ...navStyle(active),
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 1,
                    padding: "8px 13px",
                  }}
                >
                  <span
                    style={{
                      width: "100%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: 13,
                    }}
                  >
                    {t.title ?? "Yeni sohbet"}
                  </span>
                  <span style={{ fontSize: 10.5, fontWeight: 500, color: "var(--on-dark-faint)" }}>
                    {formatRelativeTime(t.updated_at)}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          color: "var(--on-dark-faint)",
          textTransform: "uppercase",
          letterSpacing: ".07em",
          padding: "6px 10px 4px",
        }}
      >
        Çalışma alanı
      </div>

      <button onClick={onNavChat} style={navStyle(chatActive)}>
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
            background: "rgba(201,106,70,.2)",
            color: "var(--terracotta-400)",
            padding: "1px 8px",
            borderRadius: 999,
          }}
        >
          {matchCount}
        </span>
      </button>
      <button onClick={onNavApplications} style={navStyle(applicationsActive)}>
        <Ms name="assignment" size={20} />
        <span>Başvurularım</span>
        {applicationCount > 0 && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 11,
              fontWeight: 700,
              background: "rgba(201,106,70,.2)",
              color: "var(--terracotta-400)",
              padding: "1px 8px",
              borderRadius: 999,
            }}
          >
            {applicationCount}
          </span>
        )}
      </button>
      <button onClick={onNavProfile} style={navStyle(profileActive)}>
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
          <Ms name="verified_user" size={17} color="var(--terracotta-400)" />
          <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--on-dark)" }}>Kaynak doğrulamalı</span>
        </div>
        <div style={{ fontSize: 11, lineHeight: 1.5, color: "var(--on-dark-muted)" }}>
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
            background: "var(--teal-700)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: "var(--on-dark)",
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{ textAlign: "left", lineHeight: 1.2, overflow: "hidden" }}>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: "var(--on-dark)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 10.5, color: "var(--on-dark-muted)" }}>{meta}</div>
        </div>
      </button>

      {/* Hesap satırı — girişliyse e-posta + çıkış, değilse giriş bağlantısı. */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,.08)",
          marginTop: 8,
          paddingTop: 10,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
          {userEmail ? (
            <>
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 11,
                  color: "var(--on-dark-muted)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={userEmail}
              >
                {userEmail}
              </div>
              <button
                onClick={onSignOut}
                title="Çıkış yap"
                aria-label="Çıkış yap"
                style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, color: "var(--terracotta-400)", flexShrink: 0 }}
              >
                <Ms name="logout" size={16} />
                Çıkış
              </button>
            </>
          ) : (
            <button
              onClick={onNavLogin}
              style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", fontSize: 12.5, fontWeight: 700, color: "var(--on-dark)", padding: "4px 2px" }}
            >
              <Ms name="login" size={17} />
              Giriş yap
            </button>
          )}
      </div>
    </aside>
  );
}