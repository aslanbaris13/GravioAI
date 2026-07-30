"use client";
import type { CSSProperties, ReactNode } from "react";
import { useRouter } from "next/navigation";

/** Giriş/kayıt/şifre ekranlarının ortak çerçevesi. Onboarding'in form diliyle
 *  (aynı input stili, aynı marka şeridi) tutarlı kalsın diye tek yerde. */

export const authInputStyle: CSSProperties = {
  width: "100%",
  padding: "13px 16px",
  borderRadius: 12,
  border: "1.5px solid var(--border-subtle)",
  fontSize: 15,
  color: "var(--ink-900)",
  background: "var(--surface-strong)",
};

export const authLabelStyle: CSSProperties = {
  fontSize: 13.5,
  fontWeight: 600,
  color: "var(--ink-600)",
  display: "block",
  marginBottom: 8,
};

export function authButtonStyle(disabled = false): CSSProperties {
  return {
    width: "100%",
    padding: "14px 0",
    borderRadius: 13,
    border: "none",
    background: disabled
      ? "var(--border-subtle)"
      : "linear-gradient(160deg,var(--terracotta-600),var(--terracotta-700))",
    color: disabled ? "var(--ink-400)" : "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: disabled ? "none" : "var(--shadow-cta)",
    marginTop: 4,
  };
}

/** Hata ve bilgi kutuları — durum renkleri token'lardan gelir. */
export function AuthNotice({ tone, children }: { tone: "error" | "info"; children: ReactNode }) {
  const isError = tone === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      style={{
        marginBottom: 16,
        padding: "12px 14px",
        borderRadius: 11,
        fontSize: 13,
        lineHeight: 1.55,
        background: isError ? "var(--danger-100)" : "var(--success-100)",
        border: `1px solid ${isError ? "var(--danger-200)" : "var(--success-200)"}`,
        color: isError ? "var(--danger-700)" : "var(--success-700)",
      }}
    >
      {children}
    </div>
  );
}

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper-100)", display: "flex", flexDirection: "column" }}>
      <div className="brand-strip" />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <button
            onClick={() => router.push("/")}
            aria-label="Ana sayfaya git"
            style={{ display: "block", margin: "0 auto 26px", padding: 0 }}
          >
            <img
              src="/brand/gravio-Text.png"
              alt="GravioAI"
              style={{ width: 250, maxWidth: "100%", height: "auto", display: "block" }}
            />
          </button>

          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 18,
              padding: "28px 26px",
            }}
          >
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink-900)", margin: "0 0 6px", letterSpacing: "-.01em" }}>
              {title}
            </h1>
            <p style={{ fontSize: 14, color: "var(--ink-600)", lineHeight: 1.55, margin: "0 0 22px" }}>{subtitle}</p>
            {children}
          </div>

          {footer && (
            <div style={{ textAlign: "center", fontSize: 13.5, color: "var(--ink-600)", marginTop: 18 }}>{footer}</div>
          )}
        </div>
      </div>
    </div>
  );
}
