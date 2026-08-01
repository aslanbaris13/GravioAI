"use client";
import OnboardingView from "@/components/OnboardingView";
import { useAppState } from "@/lib/AppStateContext";

export default function OnboardingPage() {
  const { onOnboardingComplete, onOnboardingSkip, currentProfile } = useAppState();
  return (
    <OnboardingView
      onComplete={onOnboardingComplete}
      onSkip={onOnboardingSkip}
      initialProfile={currentProfile}
    />
  );
}
