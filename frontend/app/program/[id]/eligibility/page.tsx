"use client";
import { useParams } from "next/navigation";
import EligibilityView from "@/components/EligibilityView";
import ProgramLoading from "@/components/ProgramLoading";
import ProgramNotFound from "@/components/ProgramNotFound";
import { useAppState } from "@/lib/AppStateContext";
import { useProgram } from "@/lib/useProgram";

export default function ProgramEligibilityPage() {
  const { id } = useParams<{ id: string }>();
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
