'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search as SearchIcon, MapPin, CheckCircle2, Heart } from 'lucide-react';

import { PlaceholderArt } from '@/components/aperto/placeholder-art';
import { Stars } from '@/components/aperto/stars';
import { TrustBadge } from '@/components/aperto/trust-badge';
import { useAppState } from '@/components/aperto/app-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { categories, photographers } from '@/lib/mock-data';
import { formatVnd } from '@/lib/currency';
import { cn } from '@/lib/utils';

const RATING_OPTIONS = [0, 4, 4.5, 4.8];

export function SearchScreen({ onlyFavorites = false }: { onlyFavorites?: boolean }) {
  const { favorites, toggleFavorite } = useAppState();
  const [cat, setCat] = useState('Tất cả');
  const [query, setQuery] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);

  const filtered = photographers.filter((p) => {
    if (onlyFavorites && !favorites.has(p.id)) return false;
    if (cat !== 'Tất cả' && !p.categories.includes(cat)) return false;
    if (verifiedOnly && !p.verified) return false;
    if (p.rating < minRating) return false;
    if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          {onlyFavorites ? 'Photographer đã lưu' : 'Tìm photographer phù hợp'}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {onlyFavorites
            ? 'Danh sách photographer bạn đã đánh dấu yêu thích.'
            : 'Đặt lịch chụp ảnh minh bạch — từ báo giá đến bàn giao ảnh cuối cùng.'}
        </p>
        {!onlyFavorites && (
          <div className="mt-5 flex flex-wrap gap-2">
            <Input
              type="text"
              placeholder="Tìm theo tên, khu vực, thể loại..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 min-w-[200px] flex-1"
            />
            <Button type="button" size="lg">
              <SearchIcon /> Tìm kiếm
            </Button>
          </div>
        )}
      </div>

      {!onlyFavorites && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                cat === c
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className={cn('grid gap-8', !onlyFavorites && 'lg:grid-cols-[220px_1fr]')}>
        {!onlyFavorites && (
          <aside className="flex flex-col gap-5 lg:sticky lg:top-20 lg:self-start">
            <div>
              <Label className="mb-2 block">Đánh giá tối thiểu</Label>
              <RadioGroup value={String(minRating)} onValueChange={(v) => setMinRating(Number(v))} className="gap-2">
                {RATING_OPTIONS.map((r) => (
                  <div key={r} className="flex items-center gap-2">
                    <RadioGroupItem value={String(r)} id={`rating-${r}`} />
                    <Label htmlFor={`rating-${r}`} className="flex items-center gap-1 text-sm font-normal">
                      {r === 0 ? (
                        'Tất cả'
                      ) : (
                        <>
                          {r}+ <Stars rating={r} size={12} />
                        </>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div>
              <Label className="mb-2 block">Xác minh</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="verified-only"
                  checked={verifiedOnly}
                  onCheckedChange={(c) => setVerifiedOnly(!!c)}
                />
                <Label htmlFor="verified-only" className="text-sm font-normal">
                  Chỉ hiện đã xác minh
                </Label>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Khoảng giá</Label>
              <input
                type="range"
                min={1000000}
                max={15000000}
                defaultValue={15000000}
                className="w-full accent-primary"
              />
            </div>
          </aside>
        )}

        <div>
          <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>{filtered.length} photographer phù hợp</span>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
              >
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleFavorite(p.id);
                  }}
                  className="absolute right-2.5 top-2.5 z-10 flex size-8 items-center justify-center rounded-full border border-border bg-background shadow-xs"
                >
                  <Heart
                    className={cn(
                      'size-4',
                      favorites.has(p.id) ? 'fill-destructive text-destructive' : 'text-muted-foreground',
                    )}
                  />
                </button>
                <Link href={`/photographers/${p.id}`} className="block">
                  <PlaceholderArt hue={p.avatarHue} className="h-36" />
                  <div className="p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold">
                          {p.name}
                          {p.verified && <CheckCircle2 className="size-4 text-blue-600" />}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="size-3" /> {p.location}
                        </div>
                      </div>
                      <TrustBadge level={p.trust} />
                    </div>
                    <div className="mb-3 flex flex-wrap gap-1">
                      {p.categories.map((c) => (
                        <Badge key={c} variant="secondary">
                          {c}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-3">
                      <div className="font-semibold">
                        {formatVnd(p.priceFrom)}{' '}
                        <span className="text-sm font-normal text-muted-foreground">khởi điểm</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Stars rating={p.rating} /> {p.rating} ({p.reviewCount})
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-16 text-center text-muted-foreground">
                {onlyFavorites ? 'Bạn chưa lưu photographer nào.' : 'Không tìm thấy photographer phù hợp.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
