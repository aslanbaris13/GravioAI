"use client";
import OnboardingView from "@/components/OnboardingView";
import { useAppState } from "@/lib/AppStateContext";

export default function OnboardingPage() {
  const { onOnboardingComplete, onOnboardingSkip } = useAppState();
  return <OnboardingView onComplete={onOnboardingComplete} onSkip={onOnboardingSkip} />;
}
