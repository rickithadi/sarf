'use client';

import { cn } from '@/lib/utils';

export type DayRatingLevel = 'poor' | 'fair' | 'good' | 'great' | 'epic';

interface DayRatingProps {
  rating: number | DayRatingLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * Get rating level from numeric rating (1-5)
 */
export function getRatingLevel(rating: number): DayRatingLevel {
  if (rating <= 1.5) return 'poor';
  if (rating <= 2.5) return 'fair';
  if (rating <= 3.5) return 'good';
  if (rating <= 4.5) return 'great';
  return 'epic';
}

/**
 * Get rating label from level
 */
export function getRatingLabel(level: DayRatingLevel): string {
  switch (level) {
    case 'poor':
      return 'Poor';
    case 'fair':
      return 'Fair';
    case 'good':
      return 'Good';
    case 'great':
      return 'Great';
    case 'epic':
      return 'Epic';
  }
}

/**
 * Get colors for rating level
 */
function getRatingColors(level: DayRatingLevel): { bg: string; text: string; border: string } {
  switch (level) {
    case 'poor':
      return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
    case 'fair':
      return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' };
    case 'good':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' };
    case 'great':
      return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
    case 'epic':
      return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' };
  }
}

/**
 * Day rating icon component showing Poor/Fair/Good/Great/Epic
 */
export function DayRating({
  rating,
  size = 'md',
  showLabel = true,
  className,
}: DayRatingProps) {
  const level = typeof rating === 'number' ? getRatingLevel(rating) : rating;
  const colors = getRatingColors(level);
  const label = getRatingLabel(level);

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        colors.bg,
        colors.text,
        colors.border,
        sizeClasses[size],
        className
      )}
    >
      <DayRatingIcon level={level} className={iconSizes[size]} />
      {showLabel && <span>{label}</span>}
    </div>
  );
}

/**
 * SVG icon for day rating
 */
function DayRatingIcon({
  level,
  className,
}: {
  level: DayRatingLevel;
  className?: string;
}) {
  // Use different icons for different ratings
  switch (level) {
    case 'poor':
      // Flat/choppy waves
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M2 12h20M2 16h20" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      );
    case 'fair':
      // Small wave
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M2 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      );
    case 'good':
      // Medium wave
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M2 16c2-4 4-4 6 0s4 4 6 0 4-4 6 0" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      );
    case 'great':
      // Nice wave
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M2 18c3-6 6-6 9 0s6 6 9 0" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="12" cy="10" r="2" fill="currentColor" />
        </svg>
      );
    case 'epic':
      // Perfect wave with sun
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M2 18c4-8 8-8 12 0s8 8 12 0" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="18" cy="6" r="3" fill="currentColor" />
          <line x1="18" y1="1" x2="18" y2="2" stroke="currentColor" strokeWidth="1.5" />
          <line x1="22" y1="6" x2="23" y2="6" stroke="currentColor" strokeWidth="1.5" />
          <line x1="14" y1="6" x2="13" y2="6" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
  }
}

/**
 * Compact rating dot (for use in tables)
 */
export function RatingDot({
  rating,
  className,
}: {
  rating: number | DayRatingLevel;
  className?: string;
}) {
  const level = typeof rating === 'number' ? getRatingLevel(rating) : rating;
  const colors = getRatingColors(level);

  return (
    <div
      className={cn(
        'w-3 h-3 rounded-full',
        colors.bg.replace('100', '500'),
        className
      )}
      title={getRatingLabel(level)}
    />
  );
}
