import { Fragment } from 'react';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

export function Stepper({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div className="mb-8 flex items-center">
      {labels.map((label, i) => (
        <Fragment key={label}>
          <div
            className={cn(
              'flex items-center gap-2 text-sm font-medium whitespace-nowrap',
              i <= step ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                i < step
                  ? 'border-primary bg-primary text-primary-foreground'
                  : i === step
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-muted-foreground',
              )}
            >
              {i < step ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </div>
          {i < labels.length - 1 && <div className="mx-3 h-px min-w-6 flex-1 bg-border" />}
        </Fragment>
      ))}
    </div>
  );
}
