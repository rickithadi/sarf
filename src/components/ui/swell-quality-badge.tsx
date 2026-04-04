'use client';

import { cn } from '@/lib/utils';
import {
  type SwellType,
  type PowerLevel,
  type ConsistencyLevel,
  type SwellQuality,
  getSwellTypeLabel,
  getPowerLevelLabel,
  getConsistencyLabel,
} from '@/lib/utils/wave-quality';

// ============================================================================
// Swell Type Badge
// ============================================================================

interface SwellTypeBadgeProps {
  type: SwellType | null;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const swellTypeColors: Record<SwellType, string> = {
  'ground-swell': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'long-period': 'bg-blue-100 text-blue-800 border-blue-200',
  'wind-swell': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'short-chop': 'bg-red-100 text-red-800 border-red-200',
};

const swellTypeDotColors: Record<SwellType, string> = {
  'ground-swell': 'bg-emerald-500',
  'long-period': 'bg-blue-500',
  'wind-swell': 'bg-yellow-500',
  'short-chop': 'bg-red-500',
};

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-0.5',
  lg: 'text-sm px-2.5 py-1',
};

/**
 * Badge displaying swell type (ground swell, wind swell, etc.)
 */
export function SwellTypeBadge({
  type,
  size = 'md',
  showIcon = true,
  className,
}: SwellTypeBadgeProps) {
  if (type === null) {
    return null;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        swellTypeColors[type],
        sizeClasses[size],
        className
      )}
    >
      {showIcon && (
        <span className={cn('h-1.5 w-1.5 rounded-full', swellTypeDotColors[type])} />
      )}
      {getSwellTypeLabel(type)}
    </span>
  );
}

/**
 * Compact dot indicator for swell type (for tables/lists)
 */
export function SwellTypeDot({
  type,
  size = 'md',
  className,
}: {
  type: SwellType | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  if (type === null) {
    return <span className={cn('rounded-full bg-gray-300', getDotSize(size), className)} />;
  }

  return (
    <span
      className={cn('rounded-full', swellTypeDotColors[type], getDotSize(size), className)}
      title={getSwellTypeLabel(type)}
    />
  );
}

function getDotSize(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm':
      return 'h-1.5 w-1.5';
    case 'md':
      return 'h-2 w-2';
    case 'lg':
      return 'h-2.5 w-2.5';
  }
}

// ============================================================================
// Wave Power Indicator
// ============================================================================

interface WavePowerIndicatorProps {
  level: PowerLevel | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const powerColors: Record<PowerLevel, string> = {
  low: 'text-gray-500',
  medium: 'text-yellow-500',
  high: 'text-orange-500',
  epic: 'text-red-500',
};

const powerBgColors: Record<PowerLevel, string> = {
  low: 'bg-gray-100 text-gray-700 border-gray-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  epic: 'bg-red-100 text-red-700 border-red-200',
};

/**
 * Wave power indicator with lightning bolt icons
 */
export function WavePowerIndicator({
  level,
  size = 'md',
  showLabel = true,
  className,
}: WavePowerIndicatorProps) {
  if (level === null) {
    return null;
  }

  const boltCount = getBoltCount(level);
  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  return (
    <div className={cn('inline-flex items-center gap-1', className)}>
      <span className="flex">
        {Array.from({ length: boltCount }).map((_, i) => (
          <svg
            key={i}
            className={cn(iconSize, powerColors[level])}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
              clipRule="evenodd"
            />
          </svg>
        ))}
        {/* Empty bolts for remaining */}
        {Array.from({ length: 4 - boltCount }).map((_, i) => (
          <svg
            key={`empty-${i}`}
            className={cn(iconSize, 'text-gray-200')}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
              clipRule="evenodd"
            />
          </svg>
        ))}
      </span>
      {showLabel && (
        <span className={cn('font-medium', sizeClasses[size], powerColors[level])}>
          {getPowerLevelLabel(level)}
        </span>
      )}
    </div>
  );
}

/**
 * Wave power badge (compact badge style)
 */
export function WavePowerBadge({
  level,
  size = 'md',
  className,
}: {
  level: PowerLevel | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  if (level === null) {
    return null;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        powerBgColors[level],
        sizeClasses[size],
        className
      )}
    >
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
          clipRule="evenodd"
        />
      </svg>
      {getPowerLevelLabel(level)}
    </span>
  );
}

function getBoltCount(level: PowerLevel): number {
  switch (level) {
    case 'epic':
      return 4;
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
  }
}

// ============================================================================
// Consistency Badge
// ============================================================================

interface ConsistencyBadgeProps {
  level: ConsistencyLevel | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const consistencyColors: Record<ConsistencyLevel, string> = {
  'very-consistent': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  consistent: 'bg-green-100 text-green-800 border-green-200',
  variable: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  inconsistent: 'bg-orange-100 text-orange-800 border-orange-200',
};

/**
 * Badge showing wave consistency level
 */
export function ConsistencyBadge({
  level,
  size = 'md',
  className,
}: ConsistencyBadgeProps) {
  if (level === null) {
    return null;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        consistencyColors[level],
        sizeClasses[size],
        className
      )}
    >
      {getConsistencyLabel(level)}
    </span>
  );
}

// ============================================================================
// Swell Quality Badge
// ============================================================================

interface SwellQualityBadgeProps {
  quality: SwellQuality | null;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
  className?: string;
}

const qualityColors: Record<SwellQuality['label'], string> = {
  Epic: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Good: 'bg-green-100 text-green-800 border-green-200',
  Fair: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Poor: 'bg-orange-100 text-orange-800 border-orange-200',
  Flat: 'bg-gray-100 text-gray-600 border-gray-200',
};

/**
 * Badge showing overall swell quality
 */
export function SwellQualityBadge({
  quality,
  size = 'md',
  showDescription = false,
  className,
}: SwellQualityBadgeProps) {
  if (quality === null) {
    return null;
  }

  return (
    <div className={cn('inline-flex flex-col', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border font-medium',
          qualityColors[quality.label],
          sizeClasses[size]
        )}
      >
        <span className="flex">
          {Array.from({ length: quality.score }).map((_, i) => (
            <svg key={i} className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </span>
        {quality.label}
      </span>
      {showDescription && (
        <span className="mt-0.5 text-xs text-gray-500">{quality.description}</span>
      )}
    </div>
  );
}

// ============================================================================
// Set Wave Estimate Display
// ============================================================================

interface SetWaveEstimateProps {
  averageSet: number;
  occasionalSet: number;
  sneakerSet: number;
  unit: 'imperial' | 'metric';
  className?: string;
}

/**
 * Display set wave estimates
 */
export function SetWaveEstimateDisplay({
  averageSet,
  occasionalSet,
  sneakerSet,
  unit,
  className,
}: SetWaveEstimateProps) {
  // sneakerSet available for future use
  void sneakerSet;
  const formatHeight = (meters: number): string => {
    if (unit === 'imperial') {
      const feet = meters * 3.28084;
      return `${Math.round(feet * 2) / 2}ft`;
    }
    return `${meters.toFixed(1)}m`;
  };

  return (
    <div className={cn('text-sm', className)}>
      <div className="flex items-baseline gap-1">
        <span className="text-gray-500">Sets:</span>
        <span className="font-medium text-gray-900">{formatHeight(averageSet)}</span>
        <span className="text-gray-400">avg</span>
        <span className="text-gray-300">|</span>
        <span className="font-medium text-blue-600">{formatHeight(occasionalSet)}+</span>
        <span className="text-gray-400">occasional</span>
      </div>
    </div>
  );
}

/**
 * Compact set wave estimate for inline display
 */
export function SetWaveEstimateCompact({
  averageSet,
  occasionalSet,
  unit,
  className,
}: Omit<SetWaveEstimateProps, 'sneakerSet'>) {
  const formatHeight = (meters: number): string => {
    if (unit === 'imperial') {
      const feet = meters * 3.28084;
      return `${Math.round(feet * 2) / 2}ft`;
    }
    return `${meters.toFixed(1)}m`;
  };

  return (
    <span className={cn('text-sm text-gray-600', className)}>
      Sets {formatHeight(averageSet)}, occasional {formatHeight(occasionalSet)}+
    </span>
  );
}
