'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
import { getApiErrorMessage } from '@/lib/api/client';
import { getMe, logout, resendOtp, verifyOtp, type MeResult } from '@/lib/api/auth';

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
  const router = useRouter();
  const [tab, setTab] = useState<(typeof NAV)[number]['key']>('profile');
  const [plan, setPlan] = useState('free');

  const identity = role === 'customer' ? currentCustomer : currentPhotographer;

  // Hồ sơ thật của tài khoản đang đăng nhập — thay cho trang /me riêng, dùng chung
  // UI tab "Hồ sơ cá nhân" đã có sẵn ở đây (xem GET /auth/me ở apps/api).
  const [me, setMe] = useState<MeResult | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [meError, setMeError] = useState<string | null>(null);

  const [otpCode, setOtpCode] = useState('');
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((result) => {
        if (!cancelled) setMe(result);
      })
      .catch((err) => {
        if (!cancelled) setMeError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setMeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleResendOtp = async () => {
    if (!me) return;
    setOtpError(null);
    setOtpMessage(null);
    try {
      await resendOtp(me.userId);
      setOtpMessage('Đã gửi lại mã xác thực, kiểm tra email của bạn.');
    } catch (err) {
      setOtpError(getApiErrorMessage(err));
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!me) return;
    setOtpError(null);
    setOtpSubmitting(true);
    try {
      await verifyOtp({ userId: me.userId, code: otpCode });
      setMe((prev) => (prev ? { ...prev, status: 'active' } : prev));
      setOtpCode('');
      setOtpMessage('Xác thực email thành công.');
    } catch (err) {
      setOtpError(getApiErrorMessage(err));
    } finally {
      setOtpSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      router.push('/login');
    }
  };

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

                {meError && (
                  <p className="mb-5 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {meError}
                  </p>
                )}

                {!meError && (
                  <div className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-border p-4">
                    <div>
                      <div className="font-semibold">Trạng thái xác thực email</div>
                      <div className="text-sm text-muted-foreground">
                        {meLoading
                          ? 'Đang tải...'
                          : me?.status === 'active'
                            ? 'Tài khoản đã xác thực, dùng được đầy đủ tính năng.'
                            : 'Chưa xác thực — một số chức năng sẽ bị khoá cho tới khi xác thực xong.'}
                      </div>
                    </div>
                    {!meLoading && (
                      <Badge variant={me?.status === 'active' ? 'success' : 'warning'}>
                        {me?.status === 'active' ? 'Đã xác thực' : 'Chưa xác thực'}
                      </Badge>
                    )}
                  </div>
                )}

                {me && me.status !== 'active' && (
                  <form
                    onSubmit={handleVerifyOtp}
                    className="mb-5 flex flex-col gap-3 rounded-lg border border-border p-4"
                  >
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="settings-otp">Mã xác thực đã gửi tới {me.email}</Label>
                      <div className="flex gap-2">
                        <Input
                          id="settings-otp"
                          inputMode="numeric"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="000000"
                        />
                        <Button type="submit" disabled={otpSubmitting || otpCode.length !== 6}>
                          {otpSubmitting ? 'Đang xác thực...' : 'Xác thực'}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <button
                        type="button"
                        className="font-medium text-foreground underline-offset-4 hover:underline"
                        onClick={handleResendOtp}
                      >
                        Gửi lại mã
                      </button>
                      {otpMessage && <span className="text-muted-foreground">{otpMessage}</span>}
                    </div>
                    {otpError && <p className="text-sm text-destructive">{otpError}</p>}
                  </form>
                )}

                <div className="mb-5 flex items-center gap-4">
                  <HueAvatar name={identity.name} hue={identity.avatarHue} size={64} />
                  <Button variant="secondary" size="sm">
                    Đổi ảnh đại diện
                  </Button>
                </div>
                <div key={me?.userId ?? 'loading'}>
                  <div className="mb-4 flex flex-col gap-1.5">
                    <Label htmlFor="name">Họ và tên</Label>
                    <Input id="name" defaultValue={identity.name} />
                  </div>
                  <div className="mb-4 flex flex-col gap-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={meLoading ? 'Đang tải...' : (me?.email ?? '')} readOnly />
                  </div>
                  <div className="mb-5 flex flex-col gap-1.5">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input id="phone" defaultValue={me?.phone ?? ''} placeholder="Chưa cập nhật" />
                  </div>
                </div>
                <Button className="mb-8">Lưu thay đổi</Button>

                <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-4">
                  <div>
                    <div className="font-semibold">Đăng xuất</div>
                    <div className="text-sm text-muted-foreground">
                      Kết thúc phiên đăng nhập trên thiết bị này.
                    </div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleLogout} disabled={loggingOut}>
                    {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                  </Button>
                </div>
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
