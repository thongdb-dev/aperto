'use client';

import { useState } from 'react';
import { Download, Upload, Heart, Star, CheckCircle2, Receipt } from 'lucide-react';

import { PlaceholderArt } from '@/components/aperto/placeholder-art';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { formatVnd } from '@/lib/currency';
import { cn } from '@/lib/utils';

type Role = 'customer' | 'photographer' | 'admin';

function GalleryGrid({
  count,
  hueBase,
  selectable,
  selected,
  onToggle,
  badge,
  watermark,
}: {
  count: number;
  hueBase: number;
  selectable?: boolean;
  selected?: Set<number>;
  onToggle?: (i: number) => void;
  badge?: string;
  watermark?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => {
        const isSel = selected?.has(i);
        return (
          <div
            key={i}
            onClick={() => selectable && onToggle?.(i)}
            className={cn('relative overflow-hidden rounded-lg', selectable && 'cursor-pointer')}
          >
            <PlaceholderArt
              hue={(hueBase + i * 23) % 360}
              className={cn('aspect-square', isSel && 'ring-3 ring-primary ring-inset')}
            />
            {watermark && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/15 text-xs font-semibold tracking-wide text-white/85 uppercase">
                Aperto Preview
              </div>
            )}
            {badge && (
              <Badge variant="pending" className="absolute bottom-2 left-2">
                {badge}
              </Badge>
            )}
            {selectable && (
              <span
                className={cn(
                  'absolute top-2 right-2 flex size-6 items-center justify-center rounded-full border bg-background',
                  isSel && 'border-primary bg-primary text-primary-foreground',
                )}
              >
                <Heart className="size-3.5" fill={isSel ? 'currentColor' : 'none'} />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function TabRawGallery({ role }: { role: Role }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">24 ảnh RAW · tải lên 22/06/2026</div>
        {role === 'photographer' && (
          <Button variant="secondary" size="sm">
            <Upload /> Tải ảnh RAW
          </Button>
        )}
      </div>
      <GalleryGrid count={12} hueBase={20} badge="RAW" />
    </div>
  );
}

export function TabSelected({ role }: { role: Role }) {
  const [selected, setSelected] = useState<Set<number>>(new Set([1, 3, 5, 8]));
  const toggle = (i: number) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">Đã chọn {selected.size}/120 ảnh (theo giới hạn gói)</div>
        {role === 'customer' && <Button size="sm">Xác nhận lựa chọn</Button>}
      </div>
      <GalleryGrid count={12} hueBase={20} selectable selected={selected} onToggle={toggle} />
    </div>
  );
}

export function TabEdited({ role }: { role: Role }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">8/120 ảnh đã chỉnh sửa · v1 · cập nhật 28/06/2026</div>
        {role === 'photographer' && (
          <Button variant="secondary" size="sm">
            <Upload /> Tải ảnh đã chỉnh
          </Button>
        )}
      </div>
      <GalleryGrid count={8} hueBase={280} badge="v1" />
    </div>
  );
}

export function TabDelivery({ role }: { role: Role }) {
  const paid = false;
  return (
    <div>
      <Card className="mb-8">
        <CardContent className="flex flex-col items-center py-10 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary/15">
            <Download className="size-7 text-amber-700" />
          </div>
          <h2 className="mb-2 text-lg font-semibold">Bộ ảnh cuối cùng đang chờ bàn giao</h2>
          <p className="mx-auto mb-5 max-w-md text-muted-foreground">
            {paid
              ? 'Thanh toán đã hoàn tất — bạn có thể tải toàn bộ 120 ảnh chất lượng cao. Link tải có hiệu lực 30 ngày.'
              : 'Ảnh có watermark cho đến khi thanh toán đủ. Hoàn tất phần còn lại để tải bản gốc không watermark.'}
          </p>
          {role === 'customer' &&
            (paid ? (
              <Button size="lg">
                <Download /> Tải toàn bộ (120 ảnh)
              </Button>
            ) : (
              <Button size="lg">Thanh toán {formatVnd(5250000)} để mở khoá</Button>
            ))}
          {role === 'photographer' && (
            <Button variant="secondary" size="lg">
              <Upload /> Đóng gói bàn giao
            </Button>
          )}
        </CardContent>
      </Card>
      <GalleryGrid count={8} hueBase={280} watermark={!paid} />
    </div>
  );
}

export function TabPayment({ role }: { role: Role }) {
  const rows = [
    {
      label: 'Đặt cọc (30%)',
      sub: 'Thanh toán 12/06/2026 · MoMo',
      amt: 2250000,
      variant: 'success' as const,
      statusLabel: 'Đã thanh toán',
    },
    {
      label: 'Thanh toán cuối (70%)',
      sub: 'Đến hạn khi bàn giao ảnh',
      amt: 5250000,
      variant: 'warning' as const,
      statusLabel: 'Chờ thanh toán',
    },
  ];

  return (
    <Card>
      <CardContent>
        <h2 className="mb-4 text-lg font-semibold">Lịch sử & trạng thái thanh toán</h2>
        <div className="flex flex-col gap-3">
          {rows.map((r, i) => (
            <div key={i} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
              <div>
                <div className="font-semibold">{r.label}</div>
                <div className="text-sm text-muted-foreground">{r.sub}</div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={r.variant}>{r.statusLabel}</Badge>
                <div className="font-mono font-semibold">{formatVnd(r.amt)}</div>
                {r.variant === 'warning' && role === 'customer' && <Button size="sm">Thanh toán</Button>}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Receipt className="size-3.5" /> Hoá đơn điện tử được gửi qua email sau mỗi giao dịch thành công.
        </p>
      </CardContent>
    </Card>
  );
}

export function TabReview({ role }: { role: Role }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);

  if (role === 'photographer') {
    return (
      <Card>
        <CardContent>
          <h2 className="mb-3 text-lg font-semibold">Đánh giá từ khách hàng</h2>
          <p className="py-8 text-center text-muted-foreground">
            Dự án chưa hoàn tất thanh toán — đánh giá sẽ hiển thị tại đây sau khi khách hàng gửi.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (sent) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-10 text-center">
          <CheckCircle2 className="mb-3 size-10 text-green-600" />
          <h2 className="mb-1 text-lg font-semibold">Cảm ơn bạn đã đánh giá!</h2>
          <p className="text-muted-foreground">Đánh giá của bạn góp phần vào Trust Score của photographer.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg">
      <CardContent>
        <h2 className="mb-4 text-lg font-semibold">Đánh giá photographer</h2>
        <div className="mb-5 flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)}>
              <Star className={cn('size-8', n <= rating ? 'fill-primary text-primary' : 'text-muted-foreground/30')} />
            </button>
          ))}
        </div>
        <div className="mb-5 flex flex-col gap-1.5">
          <label className="text-sm font-medium">Nhận xét</label>
          <Textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn về dự án này..."
          />
        </div>
        <Button className="w-full" disabled={!text} onClick={() => setSent(true)}>
          Gửi đánh giá
        </Button>
      </CardContent>
    </Card>
  );
}
