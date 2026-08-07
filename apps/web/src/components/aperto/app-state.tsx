'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { notifications as initialNotifications, type AppNotification, type UserRole } from '@/lib/mock-data';

interface AppState {
  role: UserRole;
  setRole: (role: UserRole) => void;
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => void;
}

const AppStateContext = createContext<AppState | null>(null);

/**
 * Client-side stand-in for real session/role state until the frontend wires up the JWT-based
 * auth from apps/api (see docs/learning/tuan-02-03-thuc-hanh.md Lab 6.2/6.3). Holds only what the
 * Topbar/Search/Dashboard/Auth screens need for now: current role, favorites, notifications.
 */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('customer');
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set(['p3']));
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);

  const toggleFavorite = (id: string) =>
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const markAllRead = () => setNotifications((arr) => arr.map((n) => ({ ...n, unread: false })));

  const unreadCount = useMemo(() => notifications.filter((n) => n.unread).length, [notifications]);

  return (
    <AppStateContext.Provider
      value={{ role, setRole, favorites, toggleFavorite, notifications, unreadCount, markAllRead }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within an AppStateProvider');
  return ctx;
}

export function roleHome(role: UserRole): string {
  if (role === 'customer') return '/search';
  if (role === 'photographer') return '/dashboard';
  return '/admin';
}
