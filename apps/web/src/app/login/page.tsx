import type { Metadata } from 'next';

import { AuthScreen } from '@/components/aperto/screens/auth-screen';

export const metadata: Metadata = {
  title: 'Đăng nhập — Aperto',
};

export default function LoginPage() {
  return <AuthScreen />;
}
