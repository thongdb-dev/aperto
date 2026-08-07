import type { Metadata } from 'next';

import { DashboardScreen } from '@/components/aperto/screens/dashboard-screen';

export const metadata: Metadata = {
  title: 'Dashboard — Aperto',
};

export default function DashboardPage() {
  return <DashboardScreen />;
}
