import Link from 'next/link';
import { Calendar } from 'lucide-react';

import { HueAvatar } from '@/components/aperto/hue-avatar';
import { TrustBadge } from '@/components/aperto/trust-badge';
import { StatCard } from '@/components/aperto/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { currentPhotographer } from '@/lib/mock-data';
import { formatVnd } from '@/lib/currency';

const requests = [
  { name: 'Gia Bảo', hue: 90, pkg: 'Gói Trọn Vẹn', date: '25/06/2026', amt: 7500000 },
  { name: 'Thanh Vy', hue: 160, pkg: 'Gói Cơ Bản', date: '28/06/2026', amt: 3500000 },
];

const active = [
  {
    id: 'demo-vintage-q3',
    name: 'Thu Trang',
    hue: 280,
    project: 'Buổi chụp Vintage — Biệt thự Q.3',
    status: 'Đang thực hiện',
    variant: 'success' as const,
    date: '20/06/2026',
  },
  {
    id: 'demo-dalat-wedding',
    name: 'Hải Đăng',
    hue: 30,
    project: 'Ảnh cưới ngoại cảnh Đà Lạt',
    status: 'Chờ RAW',
    variant: 'pending' as const,
    date: '15/06/2026',
  },
];

const trustPct = 62;

export function PhotographerDashboard() {
  const p = currentPhotographer;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Dashboard Photographer</h1>
        <Button variant="secondary" nativeButton={false} render={<Link href="/manage" />}>
          <Calendar /> Quản lý lịch trống
        </Button>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Doanh thu tháng này" value="18.6tr" delta={{ text: '↑ 12% so với tháng trước', up: true }} />
        <StatCard label="Booking chờ duyệt" value={requests.length} />
        <StatCard label="Dự án đang chạy" value={active.length} />
        <StatCard
          label="Trust Score"
          value={
            <>
              {trustPct}
              <span className="text-base font-normal text-muted-foreground">/100</span>
            </>
          }
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <h2 className="mb-4 text-lg font-semibold">Yêu cầu booking mới</h2>
          <Card className="mb-8">
            <CardContent className="divide-y divide-border">
              {requests.map((r, i) => (
                <div key={i} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <HueAvatar name={r.name} hue={r.hue} size="lg" />
                  <div className="flex-1">
                    <div className="font-medium">
                      {r.name} — {r.pkg}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {r.date} · {formatVnd(r.amt)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm">
                      Từ chối
                    </Button>
                    <Button size="sm">Chấp nhận</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <h2 className="mb-4 text-lg font-semibold">Dự án đang thực hiện</h2>
          <Card>
            <CardContent className="divide-y divide-border">
              {active.map((a) => (
                <Link
                  key={a.id}
                  href={`/workspace/${a.id}`}
                  className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <HueAvatar name={a.name} hue={a.hue} size="lg" />
                  <div className="flex-1">
                    <div className="font-medium">{a.project}</div>
                    <div className="text-sm text-muted-foreground">
                      Khách hàng: {a.name} · {a.date}
                    </div>
                  </div>
                  <Badge variant={a.variant}>{a.status}</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="text-center">
            <TrustBadge level={p.trust} />
            <div className="mt-3 font-heading text-3xl font-semibold">
              {trustPct}
              <span className="text-base font-normal text-muted-foreground">/100</span>
            </div>
            <Progress value={trustPct} className="mt-3" />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>Silver</span>
              <span>Gold</span>
              <span>Platinum</span>
              <span>Elite</span>
            </div>
            <div className="mt-5 flex flex-col gap-2 text-left text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dự án hoàn tất</span>
                <span>34</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Đánh giá trung bình</span>
                <span>4.9 ★</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Thời gian phản hồi</span>
                <span>2 giờ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Khách quay lại</span>
                <span>18%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tranh chấp</span>
                <span>0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
