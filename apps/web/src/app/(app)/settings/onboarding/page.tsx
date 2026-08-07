import type { Metadata } from 'next';

import { OnboardingScreen } from '@/components/aperto/screens/onboarding-screen';

export const metadata: Metadata = {
  title: 'Đăng ký làm Photographer — Aperto',
};

export default function OnboardingPage() {
  return <OnboardingScreen />;
}
