import type { Metadata } from 'next';

import { SettingsScreen } from '@/components/aperto/screens/settings-screen';

export const metadata: Metadata = {
  title: 'Cài đặt — Aperto',
};

export default function SettingsPage() {
  return <SettingsScreen />;
}
