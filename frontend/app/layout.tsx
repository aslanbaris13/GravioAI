import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GravioAI — Fırsat asistanı",
  description: "Yüzeyin altındaki fırsatı çıkar.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,200..600,0..1,-25..0&display=block"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
