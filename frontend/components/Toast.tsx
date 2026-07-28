import Ms from "./Ms";

export default function Toast({ show, text }: { show: boolean; text: string }) {
  if (!show) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 26,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 9,
        background: "var(--teal-900)",
        color: "#fff",
        fontSize: 13,
        fontWeight: 600,
        padding: "12px 18px",
        borderRadius: 12,
        boxShadow: "0 10px 30px rgba(22,48,46,.3)",
        zIndex: 50,
        animation: "toastIn .25s ease both",
      }}
    >
      <Ms name="check_circle" size={18} color="var(--success-300)" />
      {text}
    </div>
  );
}