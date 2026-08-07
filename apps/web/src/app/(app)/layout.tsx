import { Topbar } from '@/components/aperto/topbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <Topbar />
      <main className="w-full flex-1 px-4 py-8 sm:px-8">{children}</main>
    </div>
  );
}
