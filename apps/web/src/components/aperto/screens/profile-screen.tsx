import Link from 'next/link';
import { CheckCircle2, MapPin, MessageCircle, ChevronLeft } from 'lucide-react';

import { PlaceholderArt } from '@/components/aperto/placeholder-art';
import { HueAvatar } from '@/components/aperto/hue-avatar';
import { Stars } from '@/components/aperto/stars';
import { TrustBadge } from '@/components/aperto/trust-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { reviews, type Photographer } from '@/lib/mock-data';
import { formatVnd } from '@/lib/currency';

export function ProfileScreen({ photographer: p }: { photographer: Photographer }) {
  return (
    <div className="mx-auto max-w-5xl">
      <Button variant="ghost" size="sm" className="mb-4 w-fit" nativeButton={false} render={<Link href="/search" />}>
        <ChevronLeft /> Quay lại tìm kiếm
      </Button>

      <PlaceholderArt hue={p.avatarHue} className="h-56 rounded-xl" />
      <div className="flex flex-col gap-4 px-1 pt-4 sm:flex-row sm:items-end sm:gap-5 sm:pt-0">
        <HueAvatar
          name={p.name}
          hue={p.avatarHue}
          size={112}
          className="-mt-16 shrink-0 border-4 border-background text-3xl shadow-sm"
        />
        <div className="flex-1">
          <h1 className="flex items-center gap-2 font-heading text-2xl font-semibold">
            {p.name}
            {p.verified && <CheckCircle2 className="size-5 text-blue-600" />}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" /> {p.location}
            </span>
            <span className="flex items-center gap-1">
              <Stars rating={p.rating} /> {p.rating} ({p.reviewCount} đánh giá)
            </span>
            <span>{p.years} năm kinh nghiệm</span>
            <TrustBadge level={p.trust} />
          </div>
        </div>
        <Button variant="secondary">
          <MessageCircle /> Nhắn tin
        </Button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="mb-3 text-lg font-semibold">Giới thiệu</h2>
            <p className="text-muted-foreground">{p.bio}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.categories.map((c) => (
                <Badge key={c} variant="secondary">
                  {c}
                </Badge>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">Portfolio</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {p.portfolio.map((i) => (
                <PlaceholderArt key={i} hue={(p.avatarHue + i * 11) % 360} className="aspect-square rounded-md" />
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Đánh giá ({p.reviewCount})</h2>
              <span className="flex items-center gap-1.5 text-lg font-semibold">
                <Stars rating={p.rating} /> {p.rating}
              </span>
            </div>
            <Card>
              <CardContent className="divide-y divide-border">
                {reviews.map((r, i) => (
                  <div key={i} className="py-4 first:pt-0 last:pb-0">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <HueAvatar name={r.name} hue={r.hue} size="sm" />
                        <div>
                          <div className="text-sm font-semibold">{r.name}</div>
                          <div className="text-xs text-muted-foreground">{r.date}</div>
                        </div>
                      </div>
                      <Stars rating={r.rating} />
                    </div>
                    <p className="text-sm text-muted-foreground">{r.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent>
              <h2 className="mb-4 text-lg font-semibold">Chọn gói dịch vụ</h2>
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
                    <Button
                      className="w-full"
                      nativeButton={false}
                      render={<Link href={`/booking/${p.id}?package=${pkg.id}`} />}
                    >
                      Đặt lịch gói này
                    </Button>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Đặt cọc {p.depositPercent}% khi xác nhận booking · Hoàn tiền theo chính sách của photographer.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
