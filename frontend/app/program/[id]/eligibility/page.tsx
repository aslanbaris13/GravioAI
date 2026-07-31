"use client";
import EligibilityView from "@/components/EligibilityView";
import ProgramLoading from "@/components/ProgramLoading";
import ProgramNotFound from "@/components/ProgramNotFound";
import { useAppState } from "@/lib/AppStateContext";
import { useProgram } from "@/lib/useProgram";
import { useProgramId } from "@/lib/useProgramId";

export default function ProgramEligibilityPage() {
  const id = useProgramId();
  const { goToMatches, goToProgram, applyProgram } = useAppState();
  const { program, state } = useProgram(id);

  if (state === "loading") return <ProgramLoading />;
  if (!program) return <ProgramNotFound onBack={goToMatches} />;

  return (
    <EligibilityView
      program={program}
      onBack={() => goToProgram(id)}
      onPrimaryAction={() => applyProgram(id)}
    />
  );
}
