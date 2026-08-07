'use client';

import { useState } from 'react';
import { Upload, Plus, X } from 'lucide-react';

import { PlaceholderArt } from '@/components/aperto/placeholder-art';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { currentPhotographer, type RefundPolicy } from '@/lib/mock-data';
import { formatVnd } from '@/lib/currency';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'packages', label: 'Gói & Bảng giá' },
  { key: 'policy', label: 'Chính sách đặt cọc' },
  { key: 'calendar', label: 'Lịch trống' },
] as const;

const BUSY_DAYS = [3, 8, 9, 14, 22, 27];
const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const REFUND_LABEL: Record<RefundPolicy, string> = {
  full: 'Hoàn tiền toàn bộ nếu huỷ trước buổi chụp',
  before7: 'Hoàn tiền toàn bộ nếu huỷ trước 7 ngày',
  nonrefundable: 'Không hoàn tiền đặt cọc',
};

export function ManageScreen() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('portfolio');
  const p = currentPhotographer;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-5 font-heading text-2xl font-semibold sm:text-3xl">Quản lý hồ sơ</h1>
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              '-mb-px shrink-0 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              tab === t.key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'portfolio' && (
        <Card>
          <CardContent>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Portfolio ({p.portfolio.length}/50 ảnh — gói Free)</h2>
              <Button size="sm">
                <Upload /> Tải ảnh lên
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {p.portfolio.map((i) => (
                <div key={i} className="relative">
                  <PlaceholderArt hue={(p.avatarHue + i * 11) % 360} className="aspect-square rounded-md" />
                  <button
                    type="button"
                    className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-xs"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="flex aspect-square items-center justify-center rounded-md border-2 border-dashed border-border text-muted-foreground"
              >
                <Plus className="size-6" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'packages' && (
        <Card>
          <CardContent>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Gói dịch vụ</h2>
              <Button size="sm">
                <Plus /> Thêm gói mới
              </Button>
            </div>
            <div className="flex flex-col gap-4">
              {p.packages.map((pkg) => (
                <div key={pkg.id} className="rounded-lg border border-border p-4">
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="font-semibold">{pkg.name}</span>
                    <span className="font-semibold">{formatVnd(pkg.price)}</span>
                  </div>
                  <div className="mb-2 flex gap-3 text-sm text-muted-foreground">
                    <span>{pkg.hours} giờ</span>
                    <span>{pkg.photos} ảnh</span>
                  </div>
                  <p className="mb-3 text-sm text-muted-foreground">{pkg.desc}</p>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm">
                      Chỉnh sửa
                    </Button>
                    <Button variant="ghost" size="sm">
                      Ẩn gói
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'policy' && (
        <Card className="max-w-lg">
          <CardContent>
            <h2 className="mb-4 text-lg font-semibold">Chính sách đặt cọc & hoàn tiền</h2>
            <div className="mb-4 flex flex-col gap-1.5">
              <Label>Tỉ lệ đặt cọc</Label>
              <input type="range" min={0} max={100} defaultValue={p.depositPercent} className="w-full accent-primary" />
            </div>
            <div className="mb-5 flex flex-col gap-1.5">
              <Label>Chính sách hoàn tiền</Label>
              <Select defaultValue={p.refundPolicy}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v: RefundPolicy) => REFUND_LABEL[v] ?? v}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(REFUND_LABEL) as RefundPolicy[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {REFUND_LABEL[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Thay đổi chỉ áp dụng cho booking mới — các booking đã tạo giữ nguyên policy snapshot tại thời điểm đặt.
            </p>
            <Button>Lưu chính sách</Button>
          </CardContent>
        </Card>
      )}

      {tab === 'calendar' && <CalendarTab />}
    </div>
  );
}

function CalendarTab() {
  const [blocked, setBlocked] = useState<Set<number>>(new Set(BUSY_DAYS));
  const toggleDay = (d: number) =>
    setBlocked((s) => {
      const n = new Set(s);
      if (n.has(d)) n.delete(d);
      else n.add(d);
      return n;
    });

  return (
    <Card>
      <CardContent>
        <h2 className="mb-1 text-lg font-semibold">Lịch trống — Tháng 6/2026</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Nhấn vào ngày để chặn/mở lịch nhận booking. Đồng bộ Google Calendar dự kiến ở Phase 2.
        </p>
        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
          <div />
          {Array.from({ length: 30 }).map((_, i) => {
            const day = i + 1;
            const isBlocked = blocked.has(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={cn(
                  'aspect-square rounded-md border text-sm transition-colors',
                  isBlocked
                    ? 'border-transparent bg-muted text-muted-foreground'
                    : 'border-border hover:border-foreground',
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm border border-border" /> Còn trống
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm border border-border bg-muted" /> Đã chặn / có booking
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
