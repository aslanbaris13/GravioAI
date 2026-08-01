"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import EligibilityView from "@/components/EligibilityView";
import ProgramLoading from "@/components/ProgramLoading";
import ProgramNotFound from "@/components/ProgramNotFound";
import { useAppState } from "@/lib/AppStateContext";
import { isAuthConfigured } from "@/lib/supabase";
import { useProgram } from "@/lib/useProgram";
import { useProgramId } from "@/lib/useProgramId";

export default function ProgramEligibilityPage() {
  const id = useProgramId();
  const router = useRouter();
  const { goToMatches, goToProgram, applyProgram, userEmail } = useAppState();
  const { program, state } = useProgram(id);

  // Uygunluk kontrolü profil verisi gerektirdiği için girişli kullanıcıya
  // özel — anonim ziyaretçi buraya link/URL ile gelirse giriş sayfasına
  // yönlendirilir ve girişten sonra kaldığı yere döner.
  const authRequired = isAuthConfigured && !userEmail;
  useEffect(() => {
    if (authRequired) router.replace(`/giris?sonra=${encodeURIComponent(`/program/${id}/eligibility`)}`);
  }, [authRequired, id, router]);

  if (authRequired) return <ProgramLoading />;
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
