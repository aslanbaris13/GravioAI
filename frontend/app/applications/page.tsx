"use client";
import ApplicationsView from "@/components/ApplicationsView";
import { useAppState } from "@/lib/AppStateContext";

export default function ApplicationsPage() {
  const { trackedApplications, goToProgram, goToMatches, updateApplicationRecord } = useAppState();
  return (
    <ApplicationsView
      applications={trackedApplications}
      onOpenProgram={goToProgram}
      onGoToMatches={goToMatches}
      onChangeStatus={(id, status) => updateApplicationRecord(id, { status })}
    />
  );
}
