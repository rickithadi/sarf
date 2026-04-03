import { cn } from '@/lib/utils';

interface RatingBadgeProps {
  rating: number | null;
  size?: 'sm' | 'md' | 'lg';
}

const ratingColors: Record<number, string> = {
  1: 'bg-red-100 text-red-800 border-red-200',
  2: 'bg-orange-100 text-orange-800 border-orange-200',
  3: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  4: 'bg-green-100 text-green-800 border-green-200',
  5: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const ratingLabels: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Great',
  5: 'Epic',
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function RatingBadge({ rating, size = 'md' }: RatingBadgeProps) {
  if (rating === null) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border bg-gray-100 text-gray-500 border-gray-200 font-medium hover:bg-gray-200 transition-colors',
          sizeClasses[size]
        )}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        View
      </span>
    );
  }

  const clampedRating = Math.max(1, Math.min(5, Math.round(rating)));

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        ratingColors[clampedRating],
        sizeClasses[size]
      )}
    >
      <span className="flex">
        {Array.from({ length: clampedRating }).map((_, i) => (
          <svg
            key={i}
            className="h-3.5 w-3.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </span>
      <span>{ratingLabels[clampedRating]}</span>
    </span>
  );
}
