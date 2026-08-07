import type { Metadata } from 'next';

import { AdminScreen } from '@/components/aperto/screens/admin-screen';

export const metadata: Metadata = {
  title: 'Admin — Aperto',
};

export default function AdminPage() {
  return <AdminScreen />;
}
