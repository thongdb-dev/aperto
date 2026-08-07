import type { Metadata } from 'next';

import { SearchScreen } from '@/components/aperto/screens/search-screen';

export const metadata: Metadata = {
  title: 'Tìm kiếm — Aperto',
};

export default function SearchPage() {
  return <SearchScreen />;
}
