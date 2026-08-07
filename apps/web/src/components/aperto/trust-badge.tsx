import { Badge } from '@/components/ui/badge';
import type { TrustLevel } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const LEVEL_CLASSNAMES: Record<TrustLevel, string> = {
  Bronze: 'bg-amber-800/10 text-amber-800 dark:bg-amber-700/20 dark:text-amber-500',
  Silver: 'bg-zinc-400/20 text-zinc-700 dark:bg-zinc-400/15 dark:text-zinc-300',
  Gold: 'bg-primary/15 text-amber-800 dark:text-primary',
  Platinum: 'bg-slate-400/20 text-slate-700 dark:bg-slate-400/15 dark:text-slate-300',
  Elite: 'border border-primary bg-foreground text-primary dark:bg-black',
};

export function TrustBadge({ level, className }: { level: TrustLevel; className?: string }) {
  return (
    <Badge variant="outline" className={cn('border-transparent uppercase tracking-wide', LEVEL_CLASSNAMES[level], className)}>
      {level}
    </Badge>
  );
}
