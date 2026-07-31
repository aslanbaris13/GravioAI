"use client";
import ApplicationView from "@/components/ApplicationView";
import { useAppState } from "@/lib/AppStateContext";
import { useProgramId } from "@/lib/useProgramId";

export default function ProgramApplicationPage() {
  const id = useProgramId();
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
