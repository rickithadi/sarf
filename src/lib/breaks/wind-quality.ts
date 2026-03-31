export type WindQuality = 'offshore' | 'cross-offshore' | 'cross-shore' | 'cross-onshore' | 'onshore';

/**
 * Calculate the difference between two compass directions
 * Returns value between 0 and 180 degrees
 */
function angleDifference(angle1: number, angle2: number): number {
  const diff = Math.abs(angle1 - angle2) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Determine wind quality based on wind direction and optimal offshore direction
 * @param windDirection - Current wind direction in degrees (0-360)
 * @param optimalOffshoreDirection - The break's optimal offshore wind direction in degrees
 * @returns Wind quality classification
 */
export function calculateWindQuality(
  windDirection: number | null | undefined,
  optimalOffshoreDirection: number
): WindQuality | null {
  if (windDirection === null || windDirection === undefined) {
    return null;
  }

  const diff = angleDifference(windDirection, optimalOffshoreDirection);

  // Offshore: wind within 22.5 degrees of optimal
  if (diff <= 22.5) {
    return 'offshore';
  }

  // Cross-offshore: wind 22.5-67.5 degrees from optimal
  if (diff <= 67.5) {
    return 'cross-offshore';
  }

  // Cross-shore: wind 67.5-112.5 degrees from optimal
  if (diff <= 112.5) {
    return 'cross-shore';
  }

  // Cross-onshore: wind 112.5-157.5 degrees from optimal
  if (diff <= 157.5) {
    return 'cross-onshore';
  }

  // Onshore: wind more than 157.5 degrees from optimal
  return 'onshore';
}

/**
 * Get a rating score for wind quality (higher is better)
 */
export function windQualityScore(quality: WindQuality | null): number {
  switch (quality) {
    case 'offshore':
      return 5;
    case 'cross-offshore':
      return 4;
    case 'cross-shore':
      return 3;
    case 'cross-onshore':
      return 2;
    case 'onshore':
      return 1;
    default:
      return 0;
  }
}

/**
 * Get a human-readable description of wind quality
 */
export function windQualityDescription(quality: WindQuality | null): string {
  switch (quality) {
    case 'offshore':
      return 'Offshore - Clean, groomed waves';
    case 'cross-offshore':
      return 'Cross-offshore - Good conditions';
    case 'cross-shore':
      return 'Cross-shore - Average conditions';
    case 'cross-onshore':
      return 'Cross-onshore - Below average';
    case 'onshore':
      return 'Onshore - Choppy, poor conditions';
    default:
      return 'Unknown wind conditions';
  }
}

/**
 * Convert compass direction degrees to cardinal direction
 */
export function degreesToCardinal(degrees: number | null | undefined): string {
  if (degrees === null || degrees === undefined) {
    return 'N/A';
  }

  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}
