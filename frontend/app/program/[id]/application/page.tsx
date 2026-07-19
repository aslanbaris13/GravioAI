"use client";
import { useParams } from "next/navigation";
import ApplicationView from "@/components/ApplicationView";
import { useAppState } from "@/lib/AppStateContext";

export default function ProgramApplicationPage() {
  const { id } = useParams<{ id: string }>();
  const {
    docs,
    applicationDraft,
    applyLoading,
    toggleDoc,
    goToProgram,
    onCopyPlan,
    onDownloadPlan,
  } = useAppState();

  return (
    <ApplicationView
      docs={docs}
      applicationDraft={applicationDraft}
      applyLoading={applyLoading}
      onToggleDoc={toggleDoc}
      onBack={() => goToProgram(id)}
      onCopyPlan={onCopyPlan}
      onDownloadPlan={onDownloadPlan}
    />
  );
}
