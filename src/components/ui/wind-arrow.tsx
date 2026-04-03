'use client';

import { cn } from '@/lib/utils';
import type { WindQuality } from '@/lib/breaks/wind-quality';

interface WindArrowProps {
  direction: number | null;
  quality?: WindQuality | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * Wind direction arrow component with color coding based on wind quality
 * Arrow points in the direction the wind is blowing TO (opposite of meteorological convention)
 */
export function WindArrow({
  direction,
  quality,
  size = 'md',
  showLabel = false,
  className,
}: WindArrowProps) {
  if (direction === null) {
    return <span className="text-gray-400">-</span>;
  }

  // Get color based on wind quality
  const getQualityColor = (q: WindQuality | null | undefined): string => {
    switch (q) {
      case 'offshore':
        return 'text-emerald-500';
      case 'cross-offshore':
        return 'text-green-500';
      case 'cross-shore':
        return 'text-yellow-500';
      case 'cross-onshore':
        return 'text-orange-500';
      case 'onshore':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  // The SVG arrow points up (0°), we rotate it to match wind direction
  // Wind direction is where it's coming FROM, so we add 180° to show where it blows TO
  const rotation = direction + 180;

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <svg
        viewBox="0 0 24 24"
        className={cn(sizeClasses[size], getQualityColor(quality))}
        style={{ transform: `rotate(${rotation}deg)` }}
        fill="currentColor"
      >
        <path d="M12 2L6 14h4v8h4v-8h4L12 2z" />
      </svg>
      {showLabel && (
        <span className={cn('text-xs font-medium', getQualityColor(quality))}>
          {degreesToCardinal(direction)}
        </span>
      )}
    </div>
  );
}

/**
 * Convert degrees to cardinal direction
 */
function degreesToCardinal(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

/**
 * Inline wind display with arrow and speed
 */
interface WindDisplayProps {
  direction: number | null;
  speedKmh: number | null;
  quality?: WindQuality | null;
  unit?: 'kmh' | 'kts';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function WindDisplay({
  direction,
  speedKmh,
  quality,
  unit = 'kts',
  size = 'md',
  className,
}: WindDisplayProps) {
  const speed = speedKmh !== null
    ? unit === 'kts'
      ? Math.round(speedKmh * 0.539957)
      : Math.round(speedKmh)
    : null;

  const unitLabel = unit === 'kts' ? 'kts' : 'km/h';

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <WindArrow direction={direction} quality={quality} size={size} />
      {speed !== null && (
        <span className="text-sm font-medium">
          {speed}{unitLabel}
        </span>
      )}
    </div>
  );
}
