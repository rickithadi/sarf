'use client';

import { cn } from '@/lib/utils';
import {
  type ConfidenceLevel,
  type ForecastConfidence,
  getForecastConfidence,
  getHoursFromNow,
} from '@/lib/utils/wave-quality';

// ============================================================================
// Confidence Badge
// ============================================================================

interface ConfidenceBadgeProps {
  confidence: ForecastConfidence;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
}

const confidenceColors: Record<ConfidenceLevel, string> = {
  high: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-orange-100 text-orange-700 border-orange-200',
};

const confidenceDotColors: Record<ConfidenceLevel, string> = {
  high: 'bg-emerald-500',
  medium: 'bg-yellow-500',
  low: 'bg-orange-500',
};

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-xs px-2 py-0.5',
  lg: 'text-sm px-2.5 py-1',
};

/**
 * Badge showing forecast confidence level
 */
export function ConfidenceBadge({
  confidence,
  size = 'sm',
  showPercentage = false,
  className,
}: ConfidenceBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        confidenceColors[confidence.level],
        sizeClasses[size],
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', confidenceDotColors[confidence.level])} />
      {showPercentage ? `${confidence.percentage}%` : confidence.label}
    </span>
  );
}

// ============================================================================
// Confidence Indicator (Icon-based)
// ============================================================================

interface ConfidenceIndicatorProps {
  confidence: ForecastConfidence;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

/**
 * Compact confidence indicator with signal-strength style bars
 */
export function ConfidenceIndicator({
  confidence,
  size = 'md',
  className,
}: ConfidenceIndicatorProps) {
  const barCount = getBarCount(confidence.level);
  const barColor = getBarColor(confidence.level);
  const barHeight = size === 'sm' ? 'h-2' : size === 'lg' ? 'h-4' : 'h-3';
  const barWidth = size === 'sm' ? 'w-0.5' : size === 'lg' ? 'w-1' : 'w-0.5';
  const gap = size === 'sm' ? 'gap-0.5' : size === 'lg' ? 'gap-1' : 'gap-0.5';

  return (
    <div
      className={cn('inline-flex items-end', gap, className)}
      title={`${confidence.label} (${confidence.percentage}%)`}
    >
      {[1, 2, 3].map((bar) => (
        <div
          key={bar}
          className={cn(
            barWidth,
            'rounded-sm transition-colors',
            bar <= barCount ? barColor : 'bg-gray-200',
            bar === 1 ? `${barHeight} scale-y-50` : bar === 2 ? `${barHeight} scale-y-75` : barHeight
          )}
          style={{
            transformOrigin: 'bottom',
          }}
        />
      ))}
    </div>
  );
}

function getBarCount(level: ConfidenceLevel): number {
  switch (level) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
  }
}

function getBarColor(level: ConfidenceLevel): string {
  switch (level) {
    case 'high':
      return 'bg-emerald-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'low':
      return 'bg-orange-500';
  }
}

// ============================================================================
// Confidence Dot
// ============================================================================

interface ConfidenceDotProps {
  confidence: ForecastConfidence;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Simple colored dot for confidence level
 */
export function ConfidenceDot({
  confidence,
  size = 'md',
  className,
}: ConfidenceDotProps) {
  const dotSize = size === 'sm' ? 'h-1.5 w-1.5' : size === 'lg' ? 'h-2.5 w-2.5' : 'h-2 w-2';

  return (
    <span
      className={cn(
        'inline-block rounded-full',
        confidenceDotColors[confidence.level],
        dotSize,
        className
      )}
      title={`${confidence.label} (${confidence.percentage}%)`}
    />
  );
}

// ============================================================================
// Date Confidence Badge
// ============================================================================

interface DateConfidenceBadgeProps {
  date: Date;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'indicator' | 'dot';
  showPercentage?: boolean;
  className?: string;
}

/**
 * Automatically calculates confidence based on date and displays appropriate indicator
 */
export function DateConfidenceBadge({
  date,
  size = 'sm',
  variant = 'indicator',
  showPercentage = false,
  className,
}: DateConfidenceBadgeProps) {
  const hoursFromNow = getHoursFromNow(date);
  const confidence = getForecastConfidence(hoursFromNow);

  switch (variant) {
    case 'badge':
      return (
        <ConfidenceBadge
          confidence={confidence}
          size={size}
          showPercentage={showPercentage}
          className={className}
        />
      );
    case 'dot':
      return (
        <ConfidenceDot
          confidence={confidence}
          size={size}
          className={className}
        />
      );
    case 'indicator':
    default:
      return (
        <ConfidenceIndicator
          confidence={confidence}
          size={size}
          className={className}
        />
      );
  }
}

// ============================================================================
// Confidence Legend
// ============================================================================

interface ConfidenceLegendProps {
  className?: string;
}

/**
 * Legend explaining confidence levels
 */
export function ConfidenceLegend({ className }: ConfidenceLegendProps) {
  return (
    <div className={cn('flex items-center gap-4 text-xs text-gray-500', className)}>
      <span className="text-gray-400">Confidence:</span>
      <span className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        High (1-3 days)
      </span>
      <span className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
        Medium (4-7 days)
      </span>
      <span className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
        Low (7+ days)
      </span>
    </div>
  );
}
