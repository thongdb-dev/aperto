'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeft, Calendar, MapPin, Send, Paperclip, Plus, Check } from 'lucide-react';

import { useAppState } from '@/components/aperto/app-state';
import { HueAvatar } from '@/components/aperto/hue-avatar';
import { PlaceholderArt } from '@/components/aperto/placeholder-art';
import {
  TabRawGallery,
  TabSelected,
  TabEdited,
  TabDelivery,
  TabPayment,
  TabReview,
} from '@/components/aperto/screens/workspace-galleries';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { currentCustomer, currentPhotographer, timelineEvents, checklist, messages, moodboardNotes } from '@/lib/mock-data';
import { formatVnd } from '@/lib/currency';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'conversation', label: 'Conversation' },
  { key: 'moodboard', label: 'Moodboard' },
  { key: 'checklist', label: 'Checklist' },
  { key: 'raw', label: 'RAW Gallery' },
  { key: 'selected', label: 'Selected Photos' },
  { key: 'edited', label: 'Edited Gallery' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'payment', label: 'Payment' },
  { key: 'review', label: 'Review' },
] as const;

export function WorkspaceShell({ projectId }: { projectId: string }) {
  const { role } = useAppState();
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('overview');

  const counterpart = role === 'customer' ? currentPhotographer : currentCustomer;

  return (
    <div className="mx-auto max-w-6xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-2 w-fit"
        nativeButton={false}
        render={<Link href="/dashboard" />}
      >
        <ChevronLeft /> Quay lại Dashboard
      </Button>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Buổi chụp Vintage — Biệt thự Q.3</h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5" /> 20/06/2026, 15:00
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" /> Biệt thự cổ, Q.3
            </span>
            <Badge variant="success">Đang thực hiện</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <HueAvatar name={counterpart.name} hue={counterpart.avatarHue} />
          <span className="text-sm text-muted-foreground">{counterpart.name}</span>
        </div>
      </div>

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
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab projectId={projectId} />}
      {tab === 'conversation' && <ConversationTab role={role} />}
      {tab === 'moodboard' && <MoodboardTab />}
      {tab === 'checklist' && <ChecklistTab />}
      {tab === 'raw' && <TabRawGallery role={role} />}
      {tab === 'selected' && <TabSelected role={role} />}
      {tab === 'edited' && <TabEdited role={role} />}
      {tab === 'delivery' && <TabDelivery role={role} />}
      {tab === 'payment' && <TabPayment role={role} />}
      {tab === 'review' && <TabReview role={role} />}
    </div>
  );
}

function InfoRow({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-2 last:border-0 last:pb-0">
      <dt className="shrink-0 text-muted-foreground">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}

function OverviewTab({ projectId }: { projectId: string }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <Card>
        <CardContent>
          <h2 className="mb-4 text-lg font-semibold">Timeline dự án</h2>
          <div className="flex flex-col">
            {timelineEvents.map((e, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className={cn('size-3.5 shrink-0 rounded-full', e.done ? 'bg-primary' : 'bg-muted-foreground/30')} />
                  {i < timelineEvents.length - 1 && (
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

      <div className="flex flex-col gap-6">
        <Card>
          <CardContent>
            <h2 className="mb-3 text-lg font-semibold">Thông tin dự án</h2>
            <dl className="flex flex-col gap-2 text-sm">
              <InfoRow k="Gói dịch vụ" v="Gói Trọn Vẹn" />
              <InfoRow k="Ngày chụp" v="20/06/2026, 15:00" />
              <InfoRow k="Địa điểm" v="Biệt thự cổ, Q.3" />
              <InfoRow k="Trạng thái" v={<Badge variant="success">Đang thực hiện</Badge>} />
              <InfoRow k="Đặt cọc" v={`${formatVnd(2250000)} — đã thanh toán`} />
              <InfoRow k="Còn lại" v={formatVnd(5250000)} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="mb-3 text-lg font-semibold">Photographer</h2>
            <div className="flex items-center gap-3">
              <HueAvatar name={currentPhotographer.name} hue={currentPhotographer.avatarHue} size="lg" />
              <div>
                <div className="text-sm font-semibold">{currentPhotographer.name}</div>
                <div className="text-xs text-muted-foreground">Phản hồi {currentPhotographer.responseTime}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">Có vấn đề với dự án này?</div>
              <div className="text-xs text-muted-foreground">
                Mở tranh chấp nếu không đạt được thoả thuận trực tiếp qua Conversation.
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="shrink-0"
              nativeButton={false}
              render={<Link href={`/workspace/${projectId}/dispute`} />}
            >
              Mở tranh chấp
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ConversationTab({ role }: { role: 'customer' | 'photographer' | 'admin' }) {
  const [text, setText] = useState('');
  const mine = role === 'customer' ? 'customer' : 'photographer';

  return (
    <Card className="flex h-[560px] flex-col overflow-hidden py-0">
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
        {messages.map((m, i) => (
          <div key={i} className="contents">
            {m.date && <div className="my-1 text-center text-xs text-muted-foreground">{m.date}/2026</div>}
            <div
              className={cn(
                'max-w-[68%] rounded-2xl px-3.5 py-2.5 text-sm',
                m.from === mine
                  ? 'self-end rounded-br-sm bg-primary text-primary-foreground'
                  : 'self-start rounded-bl-sm bg-muted',
              )}
            >
              {m.text}
              <span
                className={cn(
                  'mt-1 block text-[11px] opacity-70',
                  m.from === mine ? 'text-primary-foreground/80' : 'text-muted-foreground',
                )}
              >
                {m.time}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-border p-4">
        <Input
          placeholder="Nhắn tin..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="rounded-full"
        />
        <Button variant="outline" size="icon" type="button">
          <Paperclip />
        </Button>
        <Button size="icon" type="button" onClick={() => setText('')}>
          <Send />
        </Button>
      </div>
    </Card>
  );
}

function MoodboardTab() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {moodboardNotes.map((note, i) => (
        <Card key={i} className="overflow-hidden py-0">
          <PlaceholderArt hue={(i * 47) % 360} className="aspect-[4/5]" />
          <div className="p-3 text-sm text-muted-foreground">{note}</div>
        </Card>
      ))}
      <button
        type="button"
        className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground"
      >
        <Plus className="size-6" />
        Thêm ảnh tham khảo
      </button>
    </div>
  );
}

function ChecklistTab() {
  const [items, setItems] = useState(checklist);
  const toggle = (i: number) => setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, done: !it.done } : it)));
  const doneCount = items.filter((i) => i.done).length;

  return (
    <Card>
      <CardContent>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Shot list & công việc</h2>
          <span className="text-sm text-muted-foreground">
            {doneCount}/{items.length} hoàn thành
          </span>
        </div>
        <div className="flex flex-col">
          {items.map((it, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              className="flex items-center gap-3 border-b border-border py-3 text-left last:border-0"
            >
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-md border',
                  it.done ? 'border-foreground bg-foreground text-background' : 'border-border',
                )}
              >
                {it.done && <Check className="size-3.5" />}
              </span>
              <span className={cn('text-sm', it.done && 'text-muted-foreground line-through')}>{it.text}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
