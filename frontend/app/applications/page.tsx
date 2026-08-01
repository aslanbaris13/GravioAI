"use client";
import ApplicationsView from "@/components/ApplicationsView";
import { useAppState } from "@/lib/AppStateContext";

export default function ApplicationsPage() {
  const { trackedApplications, goToProgram, applyProgram, goToMatches, updateApplicationRecord } = useAppState();

  // Henüz gönderilmemiş (taslak/hazırlanıyor) bir başvuru tıklandığında
  // programın baştan uygunluk ekranına değil, doğrudan devam eden başvuru
  // hazırlığına (taslak yeniden üretilerek) götürür. Gönderilmiş bir başvuru
  // için program detayına dönmek yeterli.
  function onOpenProgram(programId: string) {
    const record = trackedApplications.find((a) => a.program_id === programId);
    if (record && record.status !== "gonderildi") {
      void applyProgram(programId);
    } else {
      goToProgram(programId);
    }
  }

  return (
    <ApplicationsView
      applications={trackedApplications}
      onOpenProgram={onOpenProgram}
      onGoToMatches={goToMatches}
      onChangeStatus={(id, status) => updateApplicationRecord(id, { status })}
    />
  );
}
