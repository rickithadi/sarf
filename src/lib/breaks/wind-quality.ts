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
 * @param windSpeedKmh - Optional wind speed to detect calm conditions
 * @returns Wind quality classification
 */
export function calculateWindQuality(
  windDirection: number | null | undefined,
  optimalOffshoreDirection: number,
  windSpeedKmh?: number | null
): WindQuality | null {
  // If wind speed is very low (calm), treat as glassy/offshore conditions
  if (windSpeedKmh !== undefined && windSpeedKmh !== null && windSpeedKmh < 5) {
    return 'offshore'; // Calm/glassy conditions are ideal
  }

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
 * Calculate comprehensive surf rating (1-5) based on all conditions
 */
export function calculateSurfRating(params: {
  windQuality: WindQuality | null;
  windSpeedKmh: number | null;
  waveHeight: number | null;
  wavePeriod: number | null;
}): number | null {
  const { windQuality, windSpeedKmh, waveHeight, wavePeriod } = params;

  // Need at least wind or wave data to calculate rating
  if (!windQuality && !waveHeight) {
    return null;
  }

  let score = 0;
  let factors = 0;

  // Wind quality score (0-5 points, weight: 35%)
  if (windQuality) {
    const windScore = windQualityScore(windQuality);
    score += windScore * 0.35;
    factors += 0.35;
  }

  // Wind speed score (0-5 points, weight: 15%)
  // Ideal: 5-20 km/h, Poor: >35 km/h or <3 km/h
  if (windSpeedKmh !== null) {
    let speedScore = 3; // Default average
    if (windSpeedKmh >= 5 && windSpeedKmh <= 15) {
      speedScore = 5; // Ideal light winds
    } else if (windSpeedKmh > 15 && windSpeedKmh <= 25) {
      speedScore = 4; // Moderate
    } else if (windSpeedKmh > 25 && windSpeedKmh <= 35) {
      speedScore = 2; // Getting strong
    } else if (windSpeedKmh > 35) {
      speedScore = 1; // Too windy
    } else if (windSpeedKmh < 3) {
      speedScore = 4; // Glassy but might lack push
    }
    score += speedScore * 0.15;
    factors += 0.15;
  }

  // Wave height score (0-5 points, weight: 35%)
  // Ideal: 0.8-2m for most breaks
  if (waveHeight !== null) {
    let heightScore = 3;
    if (waveHeight >= 0.8 && waveHeight <= 1.5) {
      heightScore = 5; // Ideal for most surfers
    } else if (waveHeight > 1.5 && waveHeight <= 2.5) {
      heightScore = 4; // Good size
    } else if (waveHeight > 2.5 && waveHeight <= 3.5) {
      heightScore = 3; // Getting big
    } else if (waveHeight > 3.5) {
      heightScore = 2; // Expert only
    } else if (waveHeight >= 0.5 && waveHeight < 0.8) {
      heightScore = 3; // Small but surfable
    } else if (waveHeight < 0.5) {
      heightScore = 1; // Too small
    }
    score += heightScore * 0.35;
    factors += 0.35;
  }

  // Wave period score (0-5 points, weight: 15%)
  // Longer periods = better quality waves
  if (wavePeriod !== null) {
    let periodScore = 3;
    if (wavePeriod >= 12) {
      periodScore = 5; // Excellent groundswell
    } else if (wavePeriod >= 10) {
      periodScore = 4; // Good swell
    } else if (wavePeriod >= 8) {
      periodScore = 3; // Average
    } else if (wavePeriod >= 6) {
      periodScore = 2; // Short period windswell
    } else {
      periodScore = 1; // Choppy
    }
    score += periodScore * 0.15;
    factors += 0.15;
  }

  // Normalize and round to nearest integer 1-5
  if (factors === 0) return null;

  const normalizedScore = score / factors;
  return Math.max(1, Math.min(5, Math.round(normalizedScore)));
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
