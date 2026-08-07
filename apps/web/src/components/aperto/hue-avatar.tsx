import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

function initialsFor(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();
}

/** Photographer/customer avatar placeholder — hue-tinted background + initials, no real photo assets in the mock data. */
export function HueAvatar({
  name,
  hue = 42,
  size = 'default',
  className,
}: {
  name: string;
  hue?: number;
  size?: 'default' | 'sm' | 'lg' | number;
  className?: string;
}) {
  // A numeric size renders a plain div instead of the shadcn Avatar's own size-* variants,
  // since those are pinned to 24/32/40px and can't be safely overridden past that scale.
  if (typeof size === 'number') {
    return (
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full border border-border font-heading font-semibold',
          className,
        )}
        style={{
          width: size,
          height: size,
          fontSize: size * 0.36,
          background: `hsl(${hue} 55% 82%)`,
          color: `hsl(${hue} 45% 22%)`,
        }}
      >
        {initialsFor(name)}
      </div>
    );
  }

  return (
    <Avatar size={size} className={className}>
      <AvatarFallback style={{ background: `hsl(${hue} 55% 82%)`, color: `hsl(${hue} 45% 22%)` }}>
        {initialsFor(name)}
      </AvatarFallback>
    </Avatar>
  );
}
