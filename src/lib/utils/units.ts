/**
 * Unit conversion utilities for surf data
 */

// Conversion constants
const METERS_TO_FEET = 3.28084;
const KMH_TO_KNOTS = 0.539957;
const CELSIUS_TO_FAHRENHEIT_FACTOR = 9 / 5;
const CELSIUS_TO_FAHRENHEIT_OFFSET = 32;

export type UnitSystem = 'metric' | 'imperial';

/**
 * Convert meters to feet
 */
export function metersToFeet(meters: number): number {
  return meters * METERS_TO_FEET;
}

/**
 * Convert feet to meters
 */
export function feetToMeters(feet: number): number {
  return feet / METERS_TO_FEET;
}

/**
 * Convert km/h to knots
 */
export function kmhToKnots(kmh: number): number {
  return kmh * KMH_TO_KNOTS;
}

/**
 * Convert knots to km/h
 */
export function knotsToKmh(knots: number): number {
  return knots / KMH_TO_KNOTS;
}

/**
 * Convert Celsius to Fahrenheit
 */
export function celsiusToFahrenheit(celsius: number): number {
  return celsius * CELSIUS_TO_FAHRENHEIT_FACTOR + CELSIUS_TO_FAHRENHEIT_OFFSET;
}

/**
 * Convert Fahrenheit to Celsius
 */
export function fahrenheitToCelsius(fahrenheit: number): number {
  return (fahrenheit - CELSIUS_TO_FAHRENHEIT_OFFSET) / CELSIUS_TO_FAHRENHEIT_FACTOR;
}

/**
 * Format wave height with unit
 * @param heightMeters - Height in meters
 * @param system - Unit system (metric or imperial)
 * @param decimals - Number of decimal places
 */
export function formatWaveHeight(
  heightMeters: number | null,
  system: UnitSystem = 'imperial',
  decimals: number = 1
): string {
  if (heightMeters === null) return 'N/A';

  if (system === 'imperial') {
    const feet = metersToFeet(heightMeters);
    return `${feet.toFixed(decimals)}ft`;
  }
  return `${heightMeters.toFixed(decimals)}m`;
}

/**
 * Format wind speed with unit
 * @param speedKmh - Speed in km/h
 * @param system - Unit system (metric for km/h, imperial for knots)
 * @param decimals - Number of decimal places
 */
export function formatWindSpeed(
  speedKmh: number | null,
  system: UnitSystem = 'imperial',
  decimals: number = 0
): string {
  if (speedKmh === null) return 'N/A';

  if (system === 'imperial') {
    const knots = kmhToKnots(speedKmh);
    return `${knots.toFixed(decimals)}kts`;
  }
  return `${speedKmh.toFixed(decimals)}km/h`;
}

/**
 * Format temperature with unit
 * @param tempCelsius - Temperature in Celsius
 * @param system - Unit system (metric for Celsius, imperial for Fahrenheit)
 * @param decimals - Number of decimal places
 */
export function formatTemperature(
  tempCelsius: number | null,
  system: UnitSystem = 'metric',
  decimals: number = 0
): string {
  if (tempCelsius === null) return 'N/A';

  if (system === 'imperial') {
    const fahrenheit = celsiusToFahrenheit(tempCelsius);
    return `${fahrenheit.toFixed(decimals)}°F`;
  }
  return `${tempCelsius.toFixed(decimals)}°C`;
}

/**
 * Calculate surf height range based on wave height and period
 * Longer period swells tend to have more consistent heights,
 * while shorter period wind swells can be more variable.
 *
 * @param waveHeightMeters - Wave height in meters
 * @param wavePeriod - Wave period in seconds
 * @returns Object with min and max height in meters
 */
export function calculateSurfRange(
  waveHeightMeters: number | null,
  wavePeriod: number | null
): { min: number; max: number } | null {
  if (waveHeightMeters === null) return null;

  // Variance factor based on period (shorter period = more variance)
  // Long period swell (12s+): ±15% variance
  // Medium period (8-12s): ±20% variance
  // Short period (<8s): ±30% variance
  let varianceFactor = 0.25; // default

  if (wavePeriod !== null) {
    if (wavePeriod >= 12) {
      varianceFactor = 0.15;
    } else if (wavePeriod >= 8) {
      varianceFactor = 0.20;
    } else {
      varianceFactor = 0.30;
    }
  }

  const variance = waveHeightMeters * varianceFactor;
  return {
    min: Math.max(0, waveHeightMeters - variance),
    max: waveHeightMeters + variance,
  };
}

/**
 * Format surf height as a range (e.g., "1-2ft" or "0.5-0.8m")
 */
export function formatSurfRange(
  waveHeightMeters: number | null,
  wavePeriod: number | null,
  system: UnitSystem = 'imperial'
): string {
  const range = calculateSurfRange(waveHeightMeters, wavePeriod);
  if (!range) return 'Flat';

  if (system === 'imperial') {
    const minFt = metersToFeet(range.min);
    const maxFt = metersToFeet(range.max);

    // Round to nearest 0.5 for cleaner display
    const minRounded = Math.round(minFt * 2) / 2;
    const maxRounded = Math.round(maxFt * 2) / 2;

    // If min and max are the same after rounding, show single value
    if (minRounded === maxRounded) {
      return `${minRounded}ft`;
    }

    return `${minRounded}-${maxRounded}ft`;
  }

  // Metric
  const minRounded = Math.round(range.min * 10) / 10;
  const maxRounded = Math.round(range.max * 10) / 10;

  if (minRounded === maxRounded) {
    return `${minRounded}m`;
  }

  return `${minRounded}-${maxRounded}m`;
}

/**
 * Format wave period
 */
export function formatPeriod(periodSeconds: number | null): string {
  if (periodSeconds === null) return 'N/A';
  return `${Math.round(periodSeconds)}s`;
}

/**
 * Get direction arrow unicode character based on degrees
 * Direction indicates where wind/swell is coming FROM
 */
export function getDirectionArrow(degrees: number | null): string {
  if (degrees === null) return '';

  // Normalize to 0-360
  const normalized = ((degrees % 360) + 360) % 360;

  // Arrow points in the direction FROM which wind/swell comes
  // So 0° (N) means coming from the north, arrow points down
  const arrows = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘'];
  const index = Math.round(normalized / 45) % 8;
  return arrows[index];
}

/**
 * Format swell info compactly (e.g., "2.3ft 11s SSW")
 */
export function formatSwellCompact(
  heightMeters: number | null,
  periodSeconds: number | null,
  directionDegrees: number | null,
  cardinal: string,
  system: UnitSystem = 'imperial'
): string {
  if (heightMeters === null) return '-';

  const height = formatWaveHeight(heightMeters, system, 1);
  const period = periodSeconds ? `${Math.round(periodSeconds)}s` : '';
  const arrow = getDirectionArrow(directionDegrees);

  return `${height} ${period} ${cardinal} ${arrow}`.trim();
}
