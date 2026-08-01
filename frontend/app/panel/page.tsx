"use client";
import { useEffect, useState } from "react";
import DashboardView from "@/components/DashboardView";
import { exportPresentationPptx, listPresentations } from "@/lib/api";
import type { BackendPresentationRecord } from "@/lib/api";
import { useAppState } from "@/lib/AppStateContext";
import { getSessionId } from "@/lib/session";

export default function PanelPage() {
  const {
    currentProfile,
    apiPrograms,
    trackedApplications,
    ingestionRuns,
    goToProgram,
    goToChat,
    goToOnboarding,
    goToApplications,
    goToNewPresentation,
  } = useAppState();

  const [presentations, setPresentations] = useState<BackendPresentationRecord[]>([]);

  useEffect(() => {
    const sessionId = getSessionId();
    if (!sessionId) return;
    listPresentations(sessionId)
      .then(setPresentations)
      .catch(() => {});
  }, []);

  async function onDownloadPresentation(record: BackendPresentationRecord) {
    const blob = await exportPresentationPptx({ title: record.title, subtitle: record.subtitle, slides: record.slides });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${record.title.replace(/\s+/g, "-")}-Sunum.pptx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <DashboardView
      profile={currentProfile}
      programs={apiPrograms}
      applications={trackedApplications}
      ingestionRuns={ingestionRuns}
      presentations={presentations}
      onOpenProgram={goToProgram}
      onGoToChat={goToChat}
      onGoToOnboarding={goToOnboarding}
      onGoToApplications={goToApplications}
      onNewPresentation={goToNewPresentation}
      onDownloadPresentation={onDownloadPresentation}
    />
  );
}
