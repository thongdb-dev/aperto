'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';

import { HueAvatar } from '@/components/aperto/hue-avatar';
import { Stepper } from '@/components/aperto/stepper';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Photographer, RefundPolicy } from '@/lib/mock-data';
import { formatVnd } from '@/lib/currency';
import { cn } from '@/lib/utils';

const STEPS = ['Ngày & giờ', 'Chi tiết', 'Đặt cọc', 'Xác nhận'];
const TIME_SLOTS = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'];
const BUSY_DAYS = [3, 8, 9, 14, 22, 27];
const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const REFUND_LABEL: Record<RefundPolicy, string> = {
  full: 'Hoàn tiền toàn bộ nếu huỷ trước buổi chụp',
  before7: 'Hoàn tiền toàn bộ nếu huỷ trước 7 ngày',
  nonrefundable: 'Không hoàn tiền đặt cọc',
};

const PAYMENT_LABEL: Record<string, string> = {
  momo: 'Ví MoMo',
  vnpay: 'VNPay',
  stripe: 'Thẻ quốc tế (Stripe)',
};

export function BookingScreen({
  photographer: p,
  initialPackageId,
}: {
  photographer: Photographer;
  initialPackageId?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pkgId, setPkgId] = useState(
    initialPackageId && p.packages.some((pk) => pk.id === initialPackageId) ? initialPackageId : p.packages[0].id,
  );
  const [date, setDate] = useState(20);
  const [time, setTime] = useState('15:00');
  const [location, setLocation] = useState('Biệt thự cổ, Quận 3, TP.HCM');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('momo');

  const pkg = p.packages.find((x) => x.id === pkgId)!;
  const deposit = Math.round((pkg.price * p.depositPercent) / 100);
  const remaining = pkg.price - deposit;
  const daysInMonth = 30;
  const firstDayOffset = 1;

  const next = () => setStep((s) => Math.min(s + 1, 3));
  const prev = () => (step === 0 ? router.push(`/photographers/${p.id}`) : setStep((s) => s - 1));

  return (
    <div className="mx-auto max-w-5xl">
      <Button variant="ghost" size="sm" className="mb-2 w-fit" onClick={prev}>
        <ChevronLeft /> {step === 0 ? 'Quay lại hồ sơ' : 'Bước trước'}
      </Button>
      <h1 className="mb-6 font-heading text-2xl font-semibold sm:text-3xl">Đặt lịch với {p.name}</h1>
      <Stepper step={step} labels={STEPS} />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardContent>
            {step === 0 && (
              <>
                <h2 className="mb-1 text-lg font-semibold">Chọn ngày và giờ</h2>
                <p className="mb-4 text-sm text-muted-foreground">Tháng 6/2026 — chỉ hiển thị ngày còn trống</p>
                <div className="mb-5 grid grid-cols-7 gap-1.5">
                  {WEEKDAYS.map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground">
                      {d}
                    </div>
                  ))}
                  {Array.from({ length: firstDayOffset }).map((_, i) => (
                    <div key={'m' + i} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const busy = BUSY_DAYS.includes(day);
                    const selected = day === date;
                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={busy}
                        onClick={() => setDate(day)}
                        className={cn(
                          'aspect-square rounded-md border text-sm transition-colors',
                          busy
                            ? 'cursor-not-allowed border-transparent bg-muted text-muted-foreground/50'
                            : selected
                              ? 'border-foreground bg-foreground text-background'
                              : 'border-border hover:border-foreground',
                        )}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                <div className="mb-5">
                  <Label className="mb-2 block">Khung giờ</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {TIME_SLOTS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTime(t)}
                        className={cn(
                          'rounded-md border py-2 text-center text-sm transition-colors',
                          time === t
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-border hover:border-foreground',
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="location">Địa điểm</Label>
                  <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="mb-4 text-lg font-semibold">Xác nhận gói & ghi chú</h2>
                <div className="mb-5 flex flex-col gap-3">
                  {p.packages.map((pk) => (
                    <button
                      key={pk.id}
                      type="button"
                      onClick={() => setPkgId(pk.id)}
                      className={cn(
                        'rounded-lg border p-4 text-left transition-colors',
                        pk.id === pkgId ? 'border-foreground bg-primary/10' : 'border-border',
                      )}
                    >
                      <div className="mb-1 flex items-baseline justify-between">
                        <span className="font-semibold">{pk.name}</span>
                        <span className="font-semibold">{formatVnd(pk.price)}</span>
                      </div>
                      <div className="mb-2 flex gap-3 text-sm text-muted-foreground">
                        <span>{pk.hours} giờ</span>
                        <span>{pk.photos} ảnh</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{pk.desc}</p>
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="notes">Ghi chú cho photographer</Label>
                  <Textarea
                    id="notes"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Concept, phong cách, yêu cầu đặc biệt..."
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="mb-4 text-lg font-semibold">Chính sách đặt cọc & hoàn tiền</h2>
                <div className="mb-4 flex gap-3 rounded-lg border border-border p-4">
                  <div className="mt-0.5 size-4 shrink-0 rounded-full border-2 border-foreground bg-foreground" />
                  <div>
                    <div className="mb-0.5 font-semibold">
                      Đặt cọc {p.depositPercent}% — {formatVnd(deposit)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Thanh toán ngay để xác nhận booking. Phần còn lại {formatVnd(remaining)} thanh toán khi bàn giao ảnh.
                    </div>
                  </div>
                </div>
                <div className="mb-5">
                  <Label className="mb-2 block">Chính sách hoàn tiền (theo photographer thiết lập)</Label>
                  <div className="flex gap-3 rounded-lg border border-border p-4">
                    <div className="mt-0.5 size-4 shrink-0 rounded-full border-2 border-foreground bg-foreground" />
                    <div>
                      <div className="mb-0.5 font-semibold">{REFUND_LABEL[p.refundPolicy]}</div>
                      <div className="text-sm text-muted-foreground">
                        Chính sách được snapshot tại thời điểm đặt lịch, áp dụng cho toàn bộ booking này.
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Phương thức thanh toán</Label>
                  <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(String(v))}>
                    <SelectTrigger className="w-full">
                      <SelectValue>{(v: string) => PAYMENT_LABEL[v] ?? v}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="momo">Ví MoMo</SelectItem>
                      <SelectItem value="vnpay">VNPay</SelectItem>
                      <SelectItem value="stripe">Thẻ quốc tế (Stripe)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {step === 3 && (
              <div className="py-8 text-center">
                <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-primary/15">
                  <CheckCircle2 className="size-8 text-amber-700" />
                </div>
                <h2 className="mb-2 text-xl font-semibold">Đặt lịch thành công!</h2>
                <p className="mx-auto mb-6 max-w-md text-muted-foreground">
                  Photographer sẽ xác nhận trong vòng 24 giờ. Project Workspace đã được tạo — bạn có thể trao đổi và
                  theo dõi tiến độ tại đó.
                </p>
                <Button size="lg" onClick={() => router.push('/workspace/demo-vintage-q3')}>
                  Vào Project Workspace
                </Button>
              </div>
            )}

            {step < 3 && (
              <div className="mt-6 flex justify-end">
                <Button size="lg" onClick={next}>
                  {step === 2 ? `Xác nhận & thanh toán ${formatVnd(deposit)}` : 'Tiếp tục'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {step < 3 && (
          <Card className="h-fit">
            <CardContent>
              <h2 className="mb-3 text-lg font-semibold">Tóm tắt booking</h2>
              <div className="mb-3 flex items-center gap-3">
                <HueAvatar name={p.name} hue={p.avatarHue} size="lg" />
                <div>
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.location}</div>
                </div>
              </div>
              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Gói</dt>
                  <dd>{pkg.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Ngày</dt>
                  <dd>
                    {date}/06/2026, {time}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="shrink-0 text-muted-foreground">Địa điểm</dt>
                  <dd className="text-right">{location}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tổng giá gói</dt>
                  <dd>{formatVnd(pkg.price)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Đặt cọc ({p.depositPercent}%)</dt>
                  <dd>{formatVnd(deposit)}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                  <dt>Thanh toán hôm nay</dt>
                  <dd>{formatVnd(deposit)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
