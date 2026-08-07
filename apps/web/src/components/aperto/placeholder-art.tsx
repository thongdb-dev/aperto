import { Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Stand-in for a real photo — a hue-tinted gradient box, since the prototype has no real photo assets. */
export function PlaceholderArt({
  hue = 42,
  className,
}: {
  hue?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('flex items-center justify-center overflow-hidden', className)}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 70% 88%), hsl(${hue + 25} 60% 74%))`,
      }}
    >
      <Camera className="size-1/4 text-black/40" strokeWidth={1.5} />
    </div>
  );
}
