'use client';

import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getUVDescription } from '@/lib/open-meteo/weather';

interface ForecastHeaderProps {
  date: Date;
  sunrise?: Date;
  sunset?: Date;
  uvIndexMax?: number | null;
  waterTemp?: number | null;
  className?: string;
}

/**
 * Forecast header showing sunrise/sunset, UV index, and water temp
 */
export function ForecastHeader({
  date,
  sunrise,
  sunset,
  uvIndexMax,
  waterTemp,
  className,
}: ForecastHeaderProps) {
  const uvInfo = uvIndexMax !== undefined ? getUVDescription(uvIndexMax ?? null) : null;

  return (
    <div className={cn(
      'flex flex-wrap items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg',
      className
    )}>
      {/* Date */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-gray-900">
          {format(date, 'EEEE, MMMM d')}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4 ml-auto">
        {/* Sunrise */}
        {sunrise && (
          <div className="flex items-center gap-1.5">
            <SunriseIcon className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-gray-700">
              {format(sunrise, 'h:mm a')}
            </span>
          </div>
        )}

        {/* Sunset */}
        {sunset && (
          <div className="flex items-center gap-1.5">
            <SunsetIcon className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">
              {format(sunset, 'h:mm a')}
            </span>
          </div>
        )}

        {/* UV Index */}
        {uvInfo && uvIndexMax !== null && uvIndexMax !== undefined && (
          <div className="flex items-center gap-1.5">
            <UVBadge level={uvInfo.level} value={uvIndexMax} />
          </div>
        )}

        {/* Water Temperature */}
        {waterTemp !== null && waterTemp !== undefined && (
          <div className="flex items-center gap-1.5">
            <WaterIcon className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">
              {waterTemp.toFixed(0)}°C
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * UV Index badge with color coding
 */
function UVBadge({
  level,
  value,
}: {
  level: 'low' | 'moderate' | 'high' | 'very-high' | 'extreme';
  value: number;
}) {
  const colors = {
    low: 'bg-green-100 text-green-700 border-green-200',
    moderate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    'very-high': 'bg-red-100 text-red-700 border-red-200',
    extreme: 'bg-purple-100 text-purple-700 border-purple-200',
  };

  return (
    <div className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium',
      colors[level]
    )}>
      <SunIcon className="w-3.5 h-3.5" />
      <span>UV {Math.round(value)}</span>
    </div>
  );
}

// SVG Icons
function SunriseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 16v2" />
    </svg>
  );
}

function SunsetIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 10v8M4.93 4.93l2.83 2.83M16.24 7.76l2.83-2.83M2 12h4M18 12h4" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function WaterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z" />
    </svg>
  );
}

/**
 * Compact sun times display (for mobile)
 */
export function SunTimesCompact({
  sunrise,
  sunset,
  className,
}: {
  sunrise: Date;
  sunset: Date;
  className?: string;
}) {
  return (
    <div className={cn('inline-flex items-center gap-2 text-sm', className)}>
      <span className="text-orange-500">↑{format(sunrise, 'h:mm')}</span>
      <span className="text-orange-600">↓{format(sunset, 'h:mm')}</span>
    </div>
  );
}
