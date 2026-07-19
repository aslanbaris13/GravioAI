"use client";
import Ms from "./Ms";

/** Seçili program artık bilinen eşleşmeler arasında yoksa gösterilir (mock veriye düşmek yerine). */
export default function ProgramNotFound({ onBack }: { onBack: () => void }) {
  return (
    <section style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <Ms name="search_off" size={40} color="#d0cdc4" />
        <div style={{ fontSize: 16, fontWeight: 700, color: "#27353e", marginTop: 14 }}>
          Program bulunamadı
        </div>
        <div style={{ fontSize: 13.5, color: "#8a96a0", marginTop: 8, lineHeight: 1.6 }}>
          Bu program artık bilinen eşleşmeler arasında değil. Sohbete dönüp tekrar sorabilirsin.
        </div>
        <button
          onClick={onBack}
          style={{
            marginTop: 18,
            padding: "10px 18px",
            borderRadius: 10,
            background: "linear-gradient(160deg,#f97316,#ea580c)",
            color: "#fff",
            fontSize: 13.5,
            fontWeight: 600,
          }}
        >
          Eşleşmelere dön
        </button>
      </div>
    </section>
  );
}
