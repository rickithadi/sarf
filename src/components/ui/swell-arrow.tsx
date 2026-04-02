'use client';

import { cn } from '@/lib/utils';
import { formatWaveHeight, formatPeriod, type UnitSystem } from '@/lib/utils/units';
import { degreesToCardinal } from '@/lib/breaks/wind-quality';

interface SwellArrowProps {
  direction: number | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Swell direction arrow component
 * Arrow points in the direction the swell is traveling TO
 */
export function SwellArrow({
  direction,
  size = 'md',
  className,
}: SwellArrowProps) {
  if (direction === null) {
    return <span className="text-gray-400">-</span>;
  }

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  // Swell direction is where it's coming FROM, add 180° to show travel direction
  const rotation = direction + 180;

  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(sizeClasses[size], 'text-blue-500', className)}
      style={{ transform: `rotate(${rotation}deg)` }}
      fill="currentColor"
    >
      <path d="M12 2L6 14h4v8h4v-8h4L12 2z" />
    </svg>
  );
}

/**
 * Compact swell display with height, period, direction, and arrow
 */
interface SwellDisplayProps {
  heightMeters: number | null;
  periodSeconds: number | null;
  directionDegrees: number | null;
  system?: UnitSystem;
  size?: 'sm' | 'md' | 'lg';
  showPeriod?: boolean;
  className?: string;
}

export function SwellDisplay({
  heightMeters,
  periodSeconds,
  directionDegrees,
  system = 'imperial',
  size = 'md',
  showPeriod = true,
  className,
}: SwellDisplayProps) {
  if (heightMeters === null) {
    return <span className="text-gray-400">-</span>;
  }

  const cardinal = degreesToCardinal(directionDegrees);

  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="font-medium">{formatWaveHeight(heightMeters, system, 1)}</span>
      {showPeriod && periodSeconds !== null && (
        <span className="text-gray-500">{formatPeriod(periodSeconds)}</span>
      )}
      <span className="text-gray-500">{cardinal}</span>
      <SwellArrow direction={directionDegrees} size={size} />
    </div>
  );
}

/**
 * Primary swell display (larger, more prominent)
 */
interface PrimarySwellDisplayProps extends SwellDisplayProps {
  label?: string;
}

export function PrimarySwellDisplay({
  label = 'Primary',
  ...props
}: PrimarySwellDisplayProps) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
      <SwellDisplay {...props} size="md" />
    </div>
  );
}

/**
 * Secondary swell display (smaller, less prominent)
 */
export function SecondarySwellDisplay(props: SwellDisplayProps) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-400 uppercase tracking-wide">Secondary</span>
      <SwellDisplay {...props} size="sm" className="text-sm text-gray-600" />
    </div>
  );
}
