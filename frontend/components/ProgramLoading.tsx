"use client";
import Ms from "./Ms";

/** Program önbellekte yokken backend'den çekilirken gösterilir — bkz. useProgram. */
export default function ProgramLoading() {
  return (
    <section style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <Ms name="hourglass_empty" size={32} color="var(--border-subtle)" />
        <div style={{ fontSize: 13.5, color: "var(--ink-400)", marginTop: 10 }}>Program yükleniyor…</div>
      </div>
    </section>
  );
}