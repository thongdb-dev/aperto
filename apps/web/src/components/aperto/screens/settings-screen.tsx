'use client';

import { useState } from 'react';
import Link from 'next/link';

import { useAppState } from '@/components/aperto/app-state';
import { HueAvatar } from '@/components/aperto/hue-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { currentCustomer, currentPhotographer, subscriptionPlans, payoutInfo } from '@/lib/mock-data';
import { formatVnd } from '@/lib/currency';
import { cn } from '@/lib/utils';

const NAV = [
  { key: 'profile', label: 'Hồ sơ cá nhân' },
  { key: 'roles', label: 'Vai trò tài khoản' },
  { key: 'subscription', label: 'Gói dịch vụ' },
  { key: 'payout', label: 'Thanh toán & Payout' },
  { key: 'security', label: 'Bảo mật' },
  { key: 'language', label: 'Ngôn ngữ' },
] as const;

export function SettingsScreen() {
  const { role } = useAppState();
  const [tab, setTab] = useState<(typeof NAV)[number]['key']>('profile');
  const [plan, setPlan] = useState('free');

  const identity = role === 'customer' ? currentCustomer : currentPhotographer;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-5 font-heading text-2xl font-semibold sm:text-3xl">Cài đặt</h1>
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:sticky lg:top-20 lg:flex-col lg:self-start">
          {NAV.map((n) => (
            <button
              key={n.key}
              onClick={() => setTab(n.key)}
              className={cn(
                'shrink-0 rounded-md px-3.5 py-2 text-left text-sm font-medium whitespace-nowrap transition-colors',
                tab === n.key ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <Card>
          <CardContent>
            {tab === 'profile' && (
              <>
                <h2 className="mb-4 text-lg font-semibold">Thông tin cá nhân</h2>
                <div className="mb-5 flex items-center gap-4">
                  <HueAvatar name={identity.name} hue={identity.avatarHue} size={64} />
                  <Button variant="secondary" size="sm">
                    Đổi ảnh đại diện
                  </Button>
                </div>
                <div className="mb-4 flex flex-col gap-1.5">
                  <Label htmlFor="name">Họ và tên</Label>
                  <Input id="name" defaultValue={identity.name} />
                </div>
                <div className="mb-4 flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue={currentCustomer.email} />
                </div>
                <div className="mb-5 flex flex-col gap-1.5">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input id="phone" defaultValue="0901 234 567" />
                </div>
                <Button>Lưu thay đổi</Button>
              </>
            )}

            {tab === 'roles' && (
              <>
                <h2 className="mb-2 text-lg font-semibold">Vai trò tài khoản</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Một tài khoản có thể giữ cả hai vai trò Customer và Photographer. Hồ sơ Photographer cần được
                  Admin duyệt trước khi công khai.
                </p>
                <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-border p-4">
                  <div>
                    <div className="font-semibold">Khách hàng</div>
                    <div className="text-sm text-muted-foreground">Tìm & đặt lịch photographer</div>
                  </div>
                  <Badge variant="success">Đang hoạt động</Badge>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-4">
                  <div>
                    <div className="font-semibold">Photographer</div>
                    <div className="text-sm text-muted-foreground">
                      {role === 'photographer'
                        ? 'Hồ sơ đã được duyệt và công khai.'
                        : 'Mở rộng hồ sơ để nhận booking từ khách hàng.'}
                    </div>
                  </div>
                  {role === 'photographer' ? (
                    <Badge variant="success">Đã duyệt</Badge>
                  ) : (
                    <Button size="sm" nativeButton={false} render={<Link href="/settings/onboarding" />}>
                      Đăng ký làm Photographer
                    </Button>
                  )}
                </div>
              </>
            )}

            {tab === 'subscription' && (
              <>
                <h2 className="mb-4 text-lg font-semibold">Gói dịch vụ Photographer</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  {subscriptionPlans.map((pl) => (
                    <div
                      key={pl.id}
                      className={cn(
                        'relative flex flex-col rounded-xl border p-5',
                        pl.id === 'studio' ? 'border-foreground' : 'border-border',
                        plan === pl.id && 'bg-primary/5',
                      )}
                    >
                      {pl.id === 'studio' && (
                        <span className="absolute -top-2.5 right-4 rounded-full bg-foreground px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-background uppercase">
                          Phổ biến nhất
                        </span>
                      )}
                      <div className="font-heading text-lg font-semibold">{pl.name}</div>
                      <div className="mb-3 font-mono text-muted-foreground">
                        {pl.price === 0 ? 'Miễn phí' : `${formatVnd(pl.price)}/tháng`}
                      </div>
                      <ul className="mb-4 flex flex-1 flex-col gap-1.5 text-sm text-muted-foreground">
                        <li>• {pl.photos} ảnh portfolio</li>
                        <li>• {pl.packages} gói dịch vụ</li>
                        <li>• Lưu trữ RAW: {pl.storage}</li>
                        {pl.badge && <li>• Badge &quot;{pl.badge}&quot; trên hồ sơ</li>}
                        {pl.featured > 0 && <li>• {pl.featured} lượt Featured/tháng</li>}
                      </ul>
                      <Button
                        className="w-full"
                        variant={plan === pl.id ? 'secondary' : 'default'}
                        disabled={plan === pl.id}
                        onClick={() => setPlan(pl.id)}
                      >
                        {plan === pl.id ? 'Gói hiện tại' : 'Nâng cấp'}
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Subscription mở bán chính thức ở bản v1.x — hiện mọi tài khoản đang hưởng quyền lợi Free.
                </p>
              </>
            )}

            {tab === 'payout' && (
              <>
                <h2 className="mb-4 text-lg font-semibold">Thông tin nhận thanh toán</h2>
                <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-border p-4">
                  <div>
                    <div className="font-semibold">Số dư chờ payout</div>
                    <div className="text-sm text-muted-foreground">
                      Đối soát thủ công, chuyển khoản định kỳ 2 tuần/lần (v1.0)
                    </div>
                  </div>
                  <div className="font-mono font-semibold">{formatVnd(payoutInfo.pendingPayout)}</div>
                </div>
                <div className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-border p-4">
                  <div>
                    <div className="font-semibold">Payout gần nhất</div>
                    <div className="text-sm text-muted-foreground">{payoutInfo.lastPayout.date}</div>
                  </div>
                  <div className="font-mono font-semibold">{formatVnd(payoutInfo.lastPayout.amount)}</div>
                </div>
                <div className="mb-4 flex flex-col gap-1.5">
                  <Label>Ngân hàng</Label>
                  <Input defaultValue={payoutInfo.bank} />
                </div>
                <div className="mb-4 flex flex-col gap-1.5">
                  <Label>Số tài khoản</Label>
                  <Input defaultValue={payoutInfo.accountNumber} />
                </div>
                <div className="mb-5 flex flex-col gap-1.5">
                  <Label>Chủ tài khoản</Label>
                  <Input defaultValue={payoutInfo.accountName} />
                </div>
                <Button>Cập nhật thông tin</Button>
              </>
            )}

            {tab === 'security' && (
              <>
                <h2 className="mb-4 text-lg font-semibold">Bảo mật</h2>
                <div className="mb-4 flex flex-col gap-1.5">
                  <Label>Mật khẩu hiện tại</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="mb-5 flex flex-col gap-1.5">
                  <Label>Mật khẩu mới</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <Button className="mb-6">Đổi mật khẩu</Button>
                <h2 className="mb-4 text-lg font-semibold">Vùng nguy hiểm</h2>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-4">
                  <div>
                    <div className="font-semibold">Yêu cầu xoá dữ liệu cá nhân</div>
                    <div className="text-sm text-muted-foreground">
                      Theo quy định pháp luật VN về bảo vệ dữ liệu cá nhân
                    </div>
                  </div>
                  <Button variant="destructive" size="sm">
                    Gửi yêu cầu
                  </Button>
                </div>
              </>
            )}

            {tab === 'language' && (
              <>
                <h2 className="mb-4 text-lg font-semibold">Ngôn ngữ hiển thị</h2>
                <div className="inline-flex w-fit rounded-full border border-border bg-muted p-0.5">
                  <button className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background">
                    Tiếng Việt
                  </button>
                  <button className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground">
                    English
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
