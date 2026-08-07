import type { Metadata } from 'next';

import { SearchScreen } from '@/components/aperto/screens/search-screen';

export const metadata: Metadata = {
  title: 'Đã lưu — Aperto',
};

export default function SavedPage() {
  return <SearchScreen onlyFavorites />;
}
