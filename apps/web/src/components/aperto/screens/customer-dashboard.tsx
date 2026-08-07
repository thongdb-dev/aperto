import Link from 'next/link';

import { PlaceholderArt } from '@/components/aperto/placeholder-art';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/aperto/stat-card';
import { mockProjects, findPhotographer } from '@/lib/mock-data';

export function CustomerDashboard() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Dự án của tôi</h1>
        <Button nativeButton={false} render={<Link href="/search" />}>+ Tìm photographer mới</Button>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Đang thực hiện" value={2} />
        <StatCard label="Đã hoàn tất" value={6} />
        <StatCard label="Tổng đã chi" value="32.4tr" />
        <StatCard label="Chờ thanh toán" value={1} valueClassName="text-amber-600" />
      </div>

      <h2 className="mb-4 text-lg font-semibold">Dự án gần đây</h2>
      <Card>
        <CardContent className="divide-y divide-border">
          {mockProjects.map((project) => {
            const photographer = findPhotographer(project.photographerId);
            return (
              <Link
                key={project.id}
                href={`/workspace/${project.id}`}
                className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
              >
                <PlaceholderArt hue={photographer?.avatarHue ?? 0} className="size-12 shrink-0 rounded-lg" />
                <div className="flex-1">
                  <div className="font-medium">{project.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {photographer?.name} · {project.date}
                  </div>
                </div>
                <Badge variant={project.statusVariant}>{project.status}</Badge>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
