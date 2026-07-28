"use client";
import { usePathname } from "next/navigation";
import Ms from "./Ms";
import { profileInitials } from "@/lib/adapter";
import type { BackendUserProfile } from "@/lib/api";

/**
 * İnce ikon rayı — sidebar kapalıyken daima görünür (masaüstünde).
 * Claude.ai'nin çökeltilmiş sidebar rayına benzer: sadece ikonlar,
 * üstte aç/kapa düğmesi, altta kullanıcı avatarı.
 */
function railBtnStyle(active?: boolean): React.CSSProperties {
  return {
    width: 34,
    height: 34,
    borderRadius: 9,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: active ? "#fff" : "var(--on-dark-muted)",
    background: active ? "rgba(255,255,255,.09)" : "transparent",
    flexShrink: 0,
  };
}

export default function SidebarRail({
  matchCount,
  applicationCount,
  hidden,
  profile,
  onOpen,
  onNewChat,
  onNavChat,
  onNavMatches,
  onNavApplications,
  onNavProfile,
}: {
  matchCount: number;
  applicationCount: number;
  hidden: boolean;
  profile: BackendUserProfile | null;
  onOpen: () => void;
  onNewChat: () => void;
  onNavChat: () => void;
  onNavMatches: () => void;
  onNavApplications: () => void;
  onNavProfile: () => void;
}) {
  const pathname = usePathname();
  const chatActive = pathname === "/chat";
  const matchActive = pathname.startsWith("/matches") || pathname.startsWith("/program");
  const applicationsActive = pathname.startsWith("/applications");
  const profileActive = pathname === "/panel";

  return (
    <div
      className="sidebar-rail"
      style={{
        width: hidden ? 0 : 46,
        overflow: "hidden",
        transition: "width 0.22s ease",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 5,
        padding: hidden ? "16px 0" : "16px 6px",
        background: "linear-gradient(177deg,var(--teal-800) 0%,var(--teal-900) 100%)",
      }}
    >
      <button onClick={onOpen} aria-label="Menüyü aç" style={railBtnStyle()} title="Menüyü aç">
        <Ms name="dock_to_right" size={18} />
      </button>

      <div style={{ height: 1, width: 22, background: "rgba(255,255,255,.08)", margin: "6px 0 8px", flexShrink: 0 }} />

      <button onClick={onNewChat} aria-label="Yeni sohbet" style={railBtnStyle()} title="Yeni sohbet">
        <Ms name="add" size={18} />
      </button>
      <button onClick={onNavChat} aria-label="Sohbet" style={railBtnStyle(chatActive)} title="Sohbet">
        <Ms name="forum" size={17} />
      </button>
      <button onClick={onNavMatches} aria-label="Eşleşmelerim" style={{ ...railBtnStyle(matchActive), position: "relative" }} title="Eşleşmelerim">
        <Ms name="auto_awesome" size={17} />
        {matchCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 5,
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--terracotta-600)",
            }}
          />
        )}
      </button>
      <button
        onClick={onNavApplications}
        aria-label="Başvurularım"
        style={{ ...railBtnStyle(applicationsActive), position: "relative" }}
        title="Başvurularım"
      >
        <Ms name="assignment" size={17} />
        {applicationCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 5,
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--terracotta-600)",
            }}
          />
        )}
      </button>
      <button onClick={onNavProfile} aria-label="Panelim" style={railBtnStyle(profileActive)} title="Panelim">
        <Ms name="dashboard" size={17} />
      </button>

      <div style={{ flex: 1 }} />

      <button onClick={onNavProfile} aria-label="Profil" style={{ padding: 0, flexShrink: 0 }} title="Profil">
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "var(--teal-700)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11.5,
            fontWeight: 700,
            color: "var(--on-dark)",
          }}
        >
          {profileInitials(profile)}
        </div>
      </button>
    </div>
  );
}