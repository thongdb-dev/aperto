'use client';

import { useState } from 'react';
import { Bell, Calendar, MessageCircle, DollarSign, Clock, Star, Trophy } from 'lucide-react';

import { useAppState } from '@/components/aperto/app-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { NotificationType } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const ICON_BY_TYPE: Record<NotificationType, typeof Bell> = {
  booking: Calendar,
  message: MessageCircle,
  payment: DollarSign,
  system: Clock,
  review: Star,
  trust: Trophy,
};

const FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'unread', label: 'Chưa đọc' },
  { key: 'booking', label: 'Booking' },
  { key: 'message', label: 'Tin nhắn' },
  { key: 'payment', label: 'Thanh toán' },
  { key: 'system', label: 'Hệ thống' },
];

export function NotificationsScreen() {
  const { notifications, markAllRead } = useAppState();
  const [filter, setFilter] = useState('all');

  const list = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return n.unread;
    return n.type === filter;
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Thông báo</h1>
        <Button variant="secondary" size="sm" onClick={markAllRead}>
          Đánh dấu đã đọc tất cả
        </Button>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              filter === f.key
                ? 'border-foreground bg-foreground text-background'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card className="divide-y divide-border py-0">
        {list.map((n) => {
          const Icon = ICON_BY_TYPE[n.type] ?? Bell;
          return (
            <div
              key={n.id}
              className={cn('flex items-start gap-3 p-4', n.unread && 'bg-primary/5')}
            >
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-full',
                  n.urgent ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground',
                )}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{n.title}</div>
                <div className="mt-0.5 text-sm text-muted-foreground">{n.body}</div>
                <div className="mt-1 text-xs text-muted-foreground">{n.time}</div>
              </div>
              {n.unread && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-destructive" />}
            </div>
          );
        })}
        {list.length === 0 && <div className="p-10 text-center text-muted-foreground">Không có thông báo nào.</div>}
      </Card>
    </div>
  );
}
