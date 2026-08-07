import type { Metadata } from 'next';

import { NotificationsScreen } from '@/components/aperto/screens/notifications-screen';

export const metadata: Metadata = {
  title: 'Thông báo — Aperto',
};

export default function NotificationsPage() {
  return <NotificationsScreen />;
}
