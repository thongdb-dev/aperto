import type { ReactNode } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  valueClassName,
  delta,
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
  delta?: { text: string; up?: boolean };
}) {
  return (
    <Card>
      <CardContent>
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={cn('mt-2 font-heading text-2xl font-semibold', valueClassName)}>{value}</div>
        {delta && (
          <div className={cn('mt-2 text-sm', delta.up ? 'text-green-600' : 'text-destructive')}>{delta.text}</div>
        )}
      </CardContent>
    </Card>
  );
}
