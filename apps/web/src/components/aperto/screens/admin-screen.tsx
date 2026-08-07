'use client';

import { useState } from 'react';

import { HueAvatar } from '@/components/aperto/hue-avatar';
import { StatCard } from '@/components/aperto/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminStats, verificationQueue, disputes } from '@/lib/mock-data';
import { formatVnd } from '@/lib/currency';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'verification', label: 'Duyệt hồ sơ' },
  { key: 'disputes', label: 'Tranh chấp' },
  { key: 'users', label: 'Người dùng' },
] as const;

const USERS = [
  { name: 'Thu Trang', role: 'Customer', status: 'active', date: '12/03/2026' },
  { name: 'Minh Anh Studio', role: 'Photographer', status: 'active', date: '02/01/2026' },
  { name: 'Gia Bảo', role: 'Customer', status: 'active', date: '30/06/2026' },
  { name: 'Đức Phong Media', role: 'Photographer', status: 'pending_verification', date: '18/07/2026' },
];

export function AdminScreen() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('overview');

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-5 font-heading text-2xl font-semibold sm:text-3xl">Admin</h1>
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
            {t.key === 'verification' && verificationQueue.length > 0 && ` (${verificationQueue.length})`}
            {t.key === 'disputes' && disputes.length > 0 && ` (${disputes.length})`}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Tổng người dùng" value={adminStats.totalUsers.toLocaleString('vi-VN')} />
          <StatCard label="Photographer" value={adminStats.totalPhotographers} />
          <StatCard label="Chờ duyệt hồ sơ" value={adminStats.pendingVerifications} valueClassName="text-amber-600" />
          <StatCard label="Tranh chấp mở" value={adminStats.openDisputes} valueClassName="text-destructive" />
          <StatCard label="GMV tháng này" value={`${(adminStats.gmvThisMonth / 1e6).toFixed(1)}tr`} />
          <StatCard label="Hoa hồng (10%)" value={`${(adminStats.commissionThisMonth / 1e6).toFixed(1)}tr`} />
        </div>
      )}

      {tab === 'verification' && (
        <Card>
          <CardContent className="divide-y divide-border">
            {verificationQueue.map((v) => (
              <div key={v.id} className="flex flex-wrap items-center gap-4 py-4 first:pt-0 last:pb-0">
                <HueAvatar name={v.name} hue={v.hue} size="lg" />
                <div className="flex-1">
                  <div className="font-medium">{v.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {v.categories.join(', ')} · {v.portfolioCount} ảnh · nộp {v.submittedAt}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {v.idDoc ? <Badge variant="success">Có giấy tờ</Badge> : <Badge variant="warning">Thiếu giấy tờ</Badge>}
                  <Button variant="secondary" size="sm">
                    Xem hồ sơ
                  </Button>
                  <Button variant="destructive" size="sm">
                    Từ chối
                  </Button>
                  <Button size="sm">Duyệt</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tab === 'disputes' && (
        <Card>
          <CardContent className="divide-y divide-border">
            {disputes.map((d) => (
              <div key={d.id} className="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <div className="flex-1">
                  <div className="font-medium">{d.project}</div>
                  <div className="text-sm text-muted-foreground">
                    {d.customer} vs {d.photographer} · {d.reason} · mở {d.openedAt}
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{d.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={d.status === 'in_review' ? 'warning' : 'pending'}>
                    {d.status === 'in_review' ? 'Đang phân xử' : 'Chờ phản hồi'}
                  </Badge>
                  <div className="font-mono font-semibold">{formatVnd(d.amountHeld)}</div>
                  <Button variant="secondary" size="sm">
                    Xem chi tiết
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tab === 'users' && (
        <Card className="overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tham gia</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {USERS.map((u) => (
                <TableRow key={u.name}>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>
                    <Badge variant={u.status === 'active' ? 'success' : 'pending'}>
                      {u.status === 'active' ? 'Hoạt động' : 'Chờ duyệt'}
                    </Badge>
                  </TableCell>
                  <TableCell>{u.date}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      Chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
