import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { ProfileScreen } from '@/components/aperto/screens/profile-screen';
import { findPhotographer } from '@/lib/mock-data';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const photographer = findPhotographer(id);
  return { title: photographer ? `${photographer.name} — Aperto` : 'Aperto' };
}

export default async function PhotographerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const photographer = findPhotographer(id);
  if (!photographer) notFound();

  return <ProfileScreen photographer={photographer} />;
}
