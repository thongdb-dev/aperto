const APERTURE_BLADE_PATHS = [
  'M 96 50 A 46 46 0 0 1 82.527 82.527 L 55.376 64.004 L 63.703 56.101 Z',
  'M 82.527 82.527 A 46 46 0 0 1 50 96 L 43.899 63.703 L 55.376 64.004 Z',
  'M 50 96 A 46 46 0 0 1 17.473 82.527 L 35.996 55.376 L 43.899 63.703 Z',
  'M 17.473 82.527 A 46 46 0 0 1 4 50 L 36.297 43.899 L 35.996 55.376 Z',
  'M 4 50 A 46 46 0 0 1 17.473 17.473 L 44.624 35.996 L 36.297 43.899 Z',
  'M 17.473 17.473 A 46 46 0 0 1 50 4 L 56.101 36.297 L 44.624 35.996 Z',
  'M 50 4 A 46 46 0 0 1 82.527 17.473 L 64.004 44.624 L 56.101 36.297 Z',
  'M 82.527 17.473 A 46 46 0 0 1 96 50 L 63.703 56.101 L 64.004 44.624 Z',
];

export function ApertureMark({
  size = 28,
  fill = 'currentColor',
  stroke = 'none',
  strokeWidth = 1.4,
  className,
}: {
  size?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
      {APERTURE_BLADE_PATHS.map((d, i) => (
        <path key={i} d={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
      ))}
    </svg>
  );
}
