import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { BookingScreen } from '@/components/aperto/screens/booking-screen';
import { findPhotographer } from '@/lib/mock-data';

export const metadata: Metadata = {
  title: 'Đặt lịch — Aperto',
};

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ photographerId: string }>;
  searchParams: Promise<{ package?: string }>;
}) {
  const { photographerId } = await params;
  const { package: packageId } = await searchParams;
  const photographer = findPhotographer(photographerId);
  if (!photographer) notFound();

  return <BookingScreen photographer={photographer} initialPackageId={packageId} />;
}
