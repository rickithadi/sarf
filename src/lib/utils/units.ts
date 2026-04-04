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
 * Calculate wave steepness for variance determination
 * Steepness = Hs / wavelength, where wavelength ≈ 1.56 × Tp²
 */
function calculateSteepnessForVariance(
  heightMeters: number,
  periodSeconds: number | null
): number | null {
  if (periodSeconds === null || periodSeconds === 0) return null;
  const wavelength = 1.56 * Math.pow(periodSeconds, 2);
  return heightMeters / wavelength;
}

/**
 * Calculate surf height range based on wave height and period
 *
 * Uses wave steepness to determine variance (steeper = more variable):
 * - Low steepness (<0.025): ±12% - very consistent ground swell
 * - Average (0.025-0.04): ±20% - average consistency
 * - Steep (0.04-0.055): ±30% - variable wind swell
 * - Very steep (>0.055): ±40% - highly variable chop
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

  const steepness = calculateSteepnessForVariance(waveHeightMeters, wavePeriod);

  // Variance factor based on steepness (steeper = more variance)
  let varianceFactor = 0.25; // default when no period

  if (steepness !== null) {
    if (steepness < 0.025) {
      varianceFactor = 0.12; // Very consistent ground swell
    } else if (steepness < 0.04) {
      varianceFactor = 0.20; // Average consistency
    } else if (steepness < 0.055) {
      varianceFactor = 0.30; // Variable wind swell
    } else {
      varianceFactor = 0.40; // Highly variable chop
    }
  } else if (wavePeriod !== null) {
    // Fallback to period-based variance if steepness calc fails
    if (wavePeriod >= 12) {
      varianceFactor = 0.15;
    } else if (wavePeriod >= 8) {
      varianceFactor = 0.20;
    } else {
      varianceFactor = 0.30;
    }
  }

  return {
    min: Math.max(0, waveHeightMeters * (1 - varianceFactor)),
    max: waveHeightMeters * (1 + varianceFactor),
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
