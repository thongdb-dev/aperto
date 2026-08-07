'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Settings, LogOut } from 'lucide-react';

import { ApertureMark } from '@/components/aperto/aperture-mark';
import { HueAvatar } from '@/components/aperto/hue-avatar';
import { useAppState, roleHome } from '@/components/aperto/app-state';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { logout } from '@/lib/api/auth';
import { currentCustomer, currentPhotographer, type UserRole } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const CUSTOMER_NAV = [
  { href: '/search', label: 'Tìm kiếm' },
  { href: '/search/saved', label: 'Đã lưu' },
  { href: '/dashboard', label: 'Dự án của tôi' },
];
const PHOTOGRAPHER_NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/manage', label: 'Quản lý hồ sơ' },
];
const ADMIN_NAV = [{ href: '/admin', label: 'Admin' }];

const ROLE_LABEL: Record<UserRole, string> = {
  customer: 'Khách hàng',
  photographer: 'Photographer',
  admin: 'Admin',
};

export function Topbar() {
  const { role, setRole, unreadCount } = useAppState();
  const pathname = usePathname();
  const router = useRouter();

  const nav = role === 'customer' ? CUSTOMER_NAV : role === 'photographer' ? PHOTOGRAPHER_NAV : ADMIN_NAV;
  const user =
    role === 'customer'
      ? currentCustomer
      : role === 'photographer'
        ? currentPhotographer
        : { name: 'Admin', avatarHue: 0 };

  const switchRole = (r: UserRole) => {
    setRole(r);
    router.push(roleHome(r));
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="sticky top-0 z-40 flex h-16 items-center gap-6 border-b border-border bg-background px-4 sm:px-8">
      <Link href={roleHome(role)} className="flex items-center gap-2 font-heading text-lg font-semibold">
        <span className="flex size-[26px] shrink-0 items-center justify-center rounded-md bg-primary">
          <ApertureMark size={14} fill="var(--primary-foreground)" />
        </span>
        Aperto
      </Link>

      <nav className="hidden flex-1 items-center gap-1 sm:flex">
        {nav.map((item) => (
          <Button
            key={item.href}
            variant={pathname === item.href ? 'default' : 'ghost'}
            size="sm"
            nativeButton={false} render={<Link href={item.href} />}
          >
            {item.label}
          </Button>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden items-center gap-0.5 rounded-full border border-border bg-muted p-0.5 md:flex">
          {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => switchRole(r)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                role === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {ROLE_LABEL[r]}
            </button>
          ))}
        </div>

        {role !== 'admin' && (
          <Button variant="outline" size="icon" className="relative" nativeButton={false} render={<Link href="/notifications" />}>
            <Bell />
            {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" />}
          </Button>
        )}
        {role !== 'admin' && (
          <Button variant="outline" size="icon" nativeButton={false} render={<Link href="/settings" />}>
            <Settings />
          </Button>
        )}
        <ThemeToggle />
        <Button variant="outline" size="icon" title="Đăng xuất" onClick={handleLogout}>
          <LogOut />
        </Button>
        <HueAvatar name={user.name} hue={user.avatarHue} />
      </div>
    </div>
  );
}
