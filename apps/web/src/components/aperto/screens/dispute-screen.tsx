'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Upload } from 'lucide-react';

import { Stepper } from '@/components/aperto/stepper';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatVnd } from '@/lib/currency';
import { cn } from '@/lib/utils';

export function DisputeScreen({ projectId }: { projectId: string }) {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) return <DisputeStatus projectId={projectId} />;
  return <DisputeOpenForm projectId={projectId} onSubmit={() => setSubmitted(true)} />;
}

const REASON_LABEL: Record<string, string> = {
  quality: 'Chất lượng ảnh',
  mismatch: 'Không đúng cam kết',
  payment: 'Vấn đề thanh toán',
  other: 'Khác',
};

function DisputeOpenForm({ projectId, onSubmit }: { projectId: string; onSubmit: () => void }) {
  const [reason, setReason] = useState('quality');
  const [desc, setDesc] = useState('');

  return (
    <div className="mx-auto max-w-xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-2 w-fit"
        nativeButton={false}
        render={<Link href={`/workspace/${projectId}`} />}
      >
        <ChevronLeft /> Quay lại dự án
      </Button>
      <h1 className="mb-6 font-heading text-2xl font-semibold sm:text-3xl">Mở tranh chấp</h1>
      <Card>
        <CardContent>
          <div className="mb-4 flex flex-col gap-1.5">
            <Label>Loại vấn đề</Label>
            <Select value={reason} onValueChange={(v) => setReason(String(v))}>
              <SelectTrigger className="w-full">
                <SelectValue>{(v: string) => REASON_LABEL[v] ?? v}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quality">Chất lượng ảnh</SelectItem>
                <SelectItem value="mismatch">Không đúng cam kết</SelectItem>
                <SelectItem value="payment">Vấn đề thanh toán</SelectItem>
                <SelectItem value="other">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mb-4 flex flex-col gap-1.5">
            <Label htmlFor="dispute-desc">Mô tả chi tiết</Label>
            <Textarea
              id="dispute-desc"
              rows={5}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Mô tả cụ thể vấn đề gặp phải..."
            />
          </div>
          <div className="mb-4 flex items-center gap-3 rounded-lg border-2 border-dashed border-border p-5 text-sm text-muted-foreground">
            <Upload className="size-5 shrink-0" />
            Đính kèm bằng chứng (ảnh, tin nhắn chụp màn hình)
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Toàn bộ Conversation, Timeline và Gallery của dự án sẽ tự động là hồ sơ tham chiếu. Bên còn lại có 48 giờ
            để phản hồi, Admin ra quyết định trong 5 ngày làm việc. Các khoản thanh toán liên quan sẽ tạm giữ.
          </p>
          <Button variant="destructive" className="w-full" disabled={!desc} onClick={onSubmit}>
            Gửi yêu cầu tranh chấp
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function DisputeStatus({ projectId }: { projectId: string }) {
  const events = [
    { label: 'Bạn đã mở tranh chấp', date: '19/07/2026, 14:20', done: true },
    { label: 'Đang chờ Minh Anh Studio phản hồi', date: 'Hạn: 21/07/2026', done: false },
    { label: 'Admin phân xử', date: '—', done: false },
  ];

  return (
    <div className="mx-auto max-w-xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-2 w-fit"
        nativeButton={false}
        render={<Link href={`/workspace/${projectId}`} />}
      >
        <ChevronLeft /> Quay lại dự án
      </Button>
      <h1 className="mb-6 font-heading text-2xl font-semibold sm:text-3xl">Tranh chấp #D-2291</h1>

      <Card className="mb-8">
        <CardContent>
          <Stepper step={1} labels={['Mở dispute', 'Chờ phản hồi (48h)', 'Admin phân xử (5 ngày)']} />
          <dl className="flex flex-col gap-2 text-sm">
            <InfoRow k="Loại vấn đề" v="Không đúng cam kết" />
            <InfoRow k="Mở bởi" v="Bạn · 19/07/2026" />
            <InfoRow k="Hạn phản hồi" v="21/07/2026, 23:59" />
            <InfoRow k="Khoản tạm giữ" v={formatVnd(5250000)} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="mb-4 text-lg font-semibold">Diễn biến</h2>
          <div className="flex flex-col">
            {events.map((e, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className={cn('size-3.5 shrink-0 rounded-full', e.done ? 'bg-primary' : 'bg-muted-foreground/30')} />
                  {i < events.length - 1 && (
                    <span className={cn('w-0.5 flex-1', e.done ? 'bg-foreground' : 'bg-border')} style={{ minHeight: 24 }} />
                  )}
                </div>
                <div className="pb-6">
                  <div className="text-sm font-medium">{e.label}</div>
                  <div className="text-xs text-muted-foreground">{e.date}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-border pb-2 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}
