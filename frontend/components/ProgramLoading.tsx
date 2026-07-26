"use client";
import Ms from "./Ms";

/** Program önbellekte yokken backend'den çekilirken gösterilir — bkz. useProgram. */
export default function ProgramLoading() {
  return (
    <section style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <Ms name="hourglass_empty" size={32} color="#c9c4b8" />
        <div style={{ fontSize: 13.5, color: "#8a96a0", marginTop: 10 }}>Program yükleniyor…</div>
      </div>
    </section>
  );
}
