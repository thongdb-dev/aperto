'use client';

import { useAppState } from '@/components/aperto/app-state';
import { CustomerDashboard } from '@/components/aperto/screens/customer-dashboard';
import { PhotographerDashboard } from '@/components/aperto/screens/photographer-dashboard';

export function DashboardScreen() {
  const { role } = useAppState();
  return role === 'customer' ? <CustomerDashboard /> : <PhotographerDashboard />;
}
