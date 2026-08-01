"use client";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import SidebarRail from "./SidebarRail";
import Toast from "./Toast";
import Ms from "./Ms";
import { useAppState } from "@/lib/AppStateContext";

/** Onboarding sayfası dışındaki tüm rotalara sidebar/menü/toast iskeletini ekler. */
export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    matchCount,
    onNewChat,
    toastShow,
    toastText,
    currentProfile,
    trackedApplications,
    userEmail,
    signOut,
    threads,
    activeThreadId,
    openThread,
  } = useAppState();

  // Kendi tam sayfa düzeni olan rotalar sidebar kabuğunu almaz.
  const STANDALONE = ["/", "/onboarding", "/giris", "/kayit", "/sifre-sifirla"];
  if (STANDALONE.includes(pathname) || pathname.startsWith("/auth/")) {
    return <>{children}</>;
  }

  /** Rota değiştirir ve mobil çekmeceyi kapatır (masaüstünde etkisi yok). */
  const go = (path: string) => {
    router.push(path);
    setSidebarOpen(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--paper-100)" }}>
      {/* Ana sayfadaki marka şeridi — uygulama içi ekranlarda da aynı işaret. */}
      <div className="brand-strip" />
      {/* overflow:hidden — daraltılırken sola kayan panel sayfanın dışına
          taşıp yatay kaydırma çubuğu açmasın. */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
      <button
        className="mobile-menu-button"
        onClick={() => setSidebarOpen(true)}
        aria-label="Menüyü aç"
        style={{
          position: "fixed",
          top: 18,
          left: 14,
          zIndex: 20,
          width: 38,
          height: 38,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 10,
          background: "var(--teal-900)",
          boxShadow: "0 2px 10px rgba(22,48,46,.25)",
        }}
      >
        <Ms name="menu" size={20} color="#fff" />
      </button>
      <div
        className={`sidebar-backdrop${sidebarOpen ? " sidebar-open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />
      {/* Daraltılmış haldeki ince ikon rayı — tam panelin yerini alır.
          Mobilde CSS ile gizlenir; orada daraltma yerine off-canvas çekmece
          kullanılıyor. */}
      <SidebarRail
        matchCount={matchCount}
        applicationCount={trackedApplications.length}
        hidden={!sidebarCollapsed}
        profile={currentProfile}
        onOpen={() => setSidebarCollapsed(false)}
        onNewChat={() => {
          onNewChat();
          go("/chat");
        }}
        onNavChat={() => go("/chat")}
        onNavMatches={() => go("/matches")}
        onNavApplications={() => go("/applications")}
        onNavProfile={() => go("/panel")}
      />
      <Sidebar
        matchCount={matchCount}
        applicationCount={trackedApplications.length}
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        profile={currentProfile}
        onNavHome={() => go("/")}
        onNavLogin={() => go("/giris")}
        onSignOut={signOut}
        userEmail={userEmail}
        onCollapse={() => setSidebarCollapsed(true)}
        onNewChat={() => {
          onNewChat();
          go("/chat");
        }}
        onNavChat={() => go("/chat")}
        onNavMatches={() => go("/matches")}
        onNavApplications={() => go("/applications")}
        onNavProfile={() => go("/panel")}
        threads={threads}
        activeThreadId={activeThreadId}
        onOpenThread={(id) => {
          void openThread(id);
          go("/chat");
        }}
      />
      <main style={{ flex: 1, minWidth: 0, position: "relative" }}>{children}</main>
      </div>
      <Toast show={toastShow} text={toastText} />
    </div>
  );
}