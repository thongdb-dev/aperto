import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Stars({ rating = 5, size = 14, className }: { rating?: number; size?: number; className?: string }) {
  const rounded = Math.round(rating);
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-primary', className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          width={size}
          height={size}
          fill={i <= rounded ? 'currentColor' : 'none'}
          className={i <= rounded ? '' : 'text-muted-foreground/40'}
        />
      ))}
    </span>
  );
}
