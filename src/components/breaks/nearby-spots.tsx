'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { RatingBadge } from '@/components/ui/rating-badge';
import { formatSurfRange, type UnitSystem } from '@/lib/utils/units';

interface NearbySpot {
  id: string;
  name: string;
  rating: number | null;
  waveHeight: number | null;
  wavePeriod: number | null;
  distance?: number; // km
}

interface NearbySpotsProps {
  spots: NearbySpot[];
  currentSpotId: string;
  unit?: UnitSystem;
  className?: string;
}

/**
 * Horizontal scrollable bar showing nearby surf breaks
 */
export function NearbySpots({
  spots,
  currentSpotId,
  unit = 'imperial',
  className,
}: NearbySpotsProps) {
  // Filter out current spot
  const otherSpots = spots.filter(s => s.id !== currentSpotId);

  if (otherSpots.length === 0) {
    return null;
  }

  return (
    <div className={cn('', className)}>
      <h3 className="text-sm font-medium text-gray-500 mb-3">Nearby Breaks</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {otherSpots.map((spot) => (
          <NearbySpotCard
            key={spot.id}
            spot={spot}
            unit={unit}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual nearby spot card
 */
function NearbySpotCard({
  spot,
  unit,
}: {
  spot: NearbySpot;
  unit: UnitSystem;
}) {
  return (
    <Link
      href={`/${spot.id}`}
      className={cn(
        'flex-shrink-0 w-36 p-3 rounded-lg border border-gray-200 bg-white',
        'hover:border-blue-300 hover:shadow-sm transition-all'
      )}
    >
      <div className="flex flex-col gap-2">
        {/* Spot name */}
        <span className="font-medium text-gray-900 truncate text-sm">
          {spot.name}
        </span>

        {/* Wave height */}
        <span className="text-lg font-bold text-blue-600">
          {spot.waveHeight !== null
            ? formatSurfRange(spot.waveHeight, spot.wavePeriod, unit)
            : 'Flat'}
        </span>

        {/* Rating */}
        <div className="flex items-center justify-between">
          {spot.rating !== null && (
            <RatingBadge rating={spot.rating} size="sm" />
          )}
          {spot.distance !== undefined && (
            <span className="text-xs text-gray-400">
              {spot.distance.toFixed(1)}km
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/**
 * Calculate distance between two lat/lng points using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Sort spots by distance from a reference point
 */
export function sortByDistance(
  spots: Array<{ lat: number; lng: number; [key: string]: unknown }>,
  refLat: number,
  refLng: number
): Array<{ lat: number; lng: number; distance: number; [key: string]: unknown }> {
  return spots
    .map(spot => ({
      ...spot,
      distance: calculateDistance(refLat, refLng, spot.lat, spot.lng),
    }))
    .sort((a, b) => a.distance - b.distance);
}
