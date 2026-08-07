import type { Metadata } from 'next';

import { ManageScreen } from '@/components/aperto/screens/manage-screen';

export const metadata: Metadata = {
  title: 'Quản lý hồ sơ — Aperto',
};

export default function ManagePage() {
  return <ManageScreen />;
}
