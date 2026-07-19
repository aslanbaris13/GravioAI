"use client";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Toast from "./Toast";
import Ms from "./Ms";
import { useAppState } from "@/lib/AppStateContext";

/** Onboarding sayfası dışındaki tüm rotalara sidebar/menü/toast iskeletini ekler. */
export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, setSidebarOpen, matchCount, onNewChat, toastShow, toastText } = useAppState();

  if (pathname === "/onboarding") {
    return <>{children}</>;
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f4f3ef" }}>
      <button
        className="mobile-menu-button"
        onClick={() => setSidebarOpen(true)}
        aria-label="Menüyü aç"
        style={{
          position: "fixed",
          top: 14,
          left: 14,
          zIndex: 20,
          width: 38,
          height: 38,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 10,
          background: "#0d2a3c",
          boxShadow: "0 2px 10px rgba(20,34,44,.25)",
        }}
      >
        <Ms name="menu" size={20} color="#fff" />
      </button>
      <div
        className={`sidebar-backdrop${sidebarOpen ? " sidebar-open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />
      <Sidebar
        matchCount={matchCount}
        open={sidebarOpen}
        onNewChat={() => {
          onNewChat();
          router.push("/chat");
          setSidebarOpen(false);
        }}
        onNavChat={() => {
          router.push("/chat");
          setSidebarOpen(false);
        }}
        onNavMatches={() => {
          router.push("/matches");
          setSidebarOpen(false);
        }}
        onNavProfile={() => {
          router.push("/panel");
          setSidebarOpen(false);
        }}
      />
      <main style={{ flex: 1, minWidth: 0, position: "relative" }}>{children}</main>
      <Toast show={toastShow} text={toastText} />
    </div>
  );
}
