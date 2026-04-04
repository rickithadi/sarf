/**
 * Wave quality calculation utilities
 *
 * Based on oceanographic standards and surf forecasting best practices:
 * - Good Surf Now wave forecasting article
 * - NDBC wave calculations
 * - Surf science literature
 */

// ============================================================================
// Types
// ============================================================================

export type SwellType = 'ground-swell' | 'long-period' | 'wind-swell' | 'short-chop';

export type SteepnessCategory = 'swell' | 'average' | 'steep' | 'very-steep';

export type ConsistencyLevel = 'very-consistent' | 'consistent' | 'variable' | 'inconsistent';

export type PowerLevel = 'low' | 'medium' | 'high' | 'epic';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface SwellQuality {
  score: number; // 1-5
  label: 'Epic' | 'Good' | 'Fair' | 'Poor' | 'Flat';
  description: string;
}

export interface EnhancedSurfRange {
  min: number;
  max: number;
  consistency: ConsistencyLevel;
}

export interface SetWaveEstimate {
  averageSet: number;
  occasionalSet: number;
  sneakerSet: number;
}

export interface ForecastConfidence {
  level: ConfidenceLevel;
  percentage: number;
  label: string;
}

export interface WavePowerResult {
  raw: number;
  normalized: number; // 0-100 scale
  level: PowerLevel;
}

// ============================================================================
// Wave Steepness (Improvement 1)
// ============================================================================

/**
 * Calculate wave steepness using deep water approximation
 *
 * Steepness = Hs / wavelength
 * Wavelength ≈ 1.56 × Tp² (deep water approximation)
 *
 * @param heightMeters - Significant wave height in meters
 * @param periodSeconds - Wave period in seconds
 * @returns Wave steepness ratio (dimensionless)
 */
export function calculateWaveSteepness(
  heightMeters: number | null,
  periodSeconds: number | null
): number | null {
  if (heightMeters === null || periodSeconds === null || periodSeconds === 0) {
    return null;
  }

  const wavelength = 1.56 * Math.pow(periodSeconds, 2);
  return heightMeters / wavelength;
}

/**
 * Categorize wave steepness based on NDBC standards
 *
 * Categories:
 * - "swell" (clean): steepness < 0.025
 * - "average": 0.025-0.04
 * - "steep": 0.04-0.055
 * - "very steep" (choppy): > 0.055
 */
export function categorizeWaveSteepness(steepness: number | null): SteepnessCategory | null {
  if (steepness === null) return null;

  if (steepness < 0.025) return 'swell';
  if (steepness < 0.04) return 'average';
  if (steepness < 0.055) return 'steep';
  return 'very-steep';
}

/**
 * Get human-readable description of wave steepness
 */
export function getSteepnessDescription(category: SteepnessCategory | null): string {
  switch (category) {
    case 'swell':
      return 'Clean, lined-up waves';
    case 'average':
      return 'Moderate wave organization';
    case 'steep':
      return 'Steeper, less organized';
    case 'very-steep':
      return 'Choppy, disorganized conditions';
    default:
      return 'Unknown';
  }
}

// ============================================================================
// Swell Type Classification (Improvement 2)
// ============================================================================

/**
 * Classify swell type based on wave period
 *
 * Classification:
 * - ≥14s → Ground Swell (powerful, clean)
 * - 10-14s → Long Period (good quality)
 * - 7-10s → Wind Swell (average)
 * - <7s → Short Chop (poor quality)
 *
 * @param periodSeconds - Wave period in seconds
 * @returns Swell type classification
 */
export function classifySwellType(periodSeconds: number | null): SwellType | null {
  if (periodSeconds === null) return null;

  if (periodSeconds >= 14) return 'ground-swell';
  if (periodSeconds >= 10) return 'long-period';
  if (periodSeconds >= 7) return 'wind-swell';
  return 'short-chop';
}

/**
 * Get display label for swell type
 */
export function getSwellTypeLabel(type: SwellType | null): string {
  switch (type) {
    case 'ground-swell':
      return 'Ground Swell';
    case 'long-period':
      return 'Long Period';
    case 'wind-swell':
      return 'Wind Swell';
    case 'short-chop':
      return 'Short Chop';
    default:
      return 'Unknown';
  }
}

/**
 * Get description for swell type
 */
export function getSwellTypeDescription(type: SwellType | null): string {
  switch (type) {
    case 'ground-swell':
      return 'Powerful, well-organized waves from distant storms';
    case 'long-period':
      return 'Good quality waves with consistent sets';
    case 'wind-swell':
      return 'Locally generated waves, average quality';
    case 'short-chop':
      return 'Short period chop, poor wave quality';
    default:
      return 'Unknown wave conditions';
  }
}

// ============================================================================
// Wave Power Calculation (Improvement 3)
// ============================================================================

/**
 * Calculate wave power/energy flux
 *
 * Wave power (kW/m) = (ρg²/64π) × Hs² × Tp
 * Simplified: Power ∝ Hs² × Tp
 *
 * A 1m @ 15s swell has significantly more energy than 1m @ 6s
 *
 * @param heightMeters - Significant wave height in meters
 * @param periodSeconds - Wave period in seconds
 * @returns Wave power result with raw, normalized (0-100), and level
 */
export function calculateWavePower(
  heightMeters: number | null,
  periodSeconds: number | null
): WavePowerResult | null {
  if (heightMeters === null || periodSeconds === null) {
    return null;
  }

  // Raw power is proportional to Hs² × Tp
  const rawPower = Math.pow(heightMeters, 2) * periodSeconds;

  // Normalize to 0-100 scale
  // Reference: 2m @ 14s = ~56 raw power = high/epic threshold
  const normalized = Math.min(100, (rawPower / 60) * 100);

  // Categorize power level
  let level: PowerLevel;
  if (normalized >= 75) {
    level = 'epic';
  } else if (normalized >= 50) {
    level = 'high';
  } else if (normalized >= 25) {
    level = 'medium';
  } else {
    level = 'low';
  }

  return {
    raw: rawPower,
    normalized,
    level,
  };
}

/**
 * Get power level display label
 */
export function getPowerLevelLabel(level: PowerLevel): string {
  switch (level) {
    case 'epic':
      return 'Epic';
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
  }
}

// ============================================================================
// Enhanced Surf Range (Improvement 4)
// ============================================================================

/**
 * Calculate surf range using wave steepness for variance
 *
 * Steeper waves = more variance, less consistency
 * - Low steepness (<0.025): ±12% - very consistent ground swell
 * - Average (0.025-0.04): ±20% - average consistency
 * - Steep (0.04-0.055): ±30% - variable wind swell
 * - Very steep (>0.055): ±40% - highly variable chop
 *
 * @param heightMeters - Wave height in meters
 * @param periodSeconds - Wave period in seconds
 * @returns Enhanced surf range with min, max, and consistency level
 */
export function calculateEnhancedSurfRange(
  heightMeters: number | null,
  periodSeconds: number | null
): EnhancedSurfRange | null {
  if (heightMeters === null) return null;

  const steepness = calculateWaveSteepness(heightMeters, periodSeconds);

  let variance: number;
  let consistency: ConsistencyLevel;

  if (steepness === null) {
    // Default if no period data
    variance = 0.25;
    consistency = 'variable';
  } else if (steepness < 0.025) {
    variance = 0.12;
    consistency = 'very-consistent';
  } else if (steepness < 0.04) {
    variance = 0.20;
    consistency = 'consistent';
  } else if (steepness < 0.055) {
    variance = 0.30;
    consistency = 'variable';
  } else {
    variance = 0.40;
    consistency = 'inconsistent';
  }

  return {
    min: Math.max(0, heightMeters * (1 - variance)),
    max: heightMeters * (1 + variance),
    consistency,
  };
}

/**
 * Get display label for consistency level
 */
export function getConsistencyLabel(level: ConsistencyLevel): string {
  switch (level) {
    case 'very-consistent':
      return 'Very consistent';
    case 'consistent':
      return 'Consistent';
    case 'variable':
      return 'Variable';
    case 'inconsistent':
      return 'Inconsistent';
  }
}

// ============================================================================
// Swell Quality Score (Improvement 5)
// ============================================================================

/**
 * Calculate swell quality score
 *
 * Weights:
 * - Period: 50% (most important for surf quality)
 * - Height: 30%
 * - Steepness: 20%
 *
 * @param heightMeters - Wave height in meters
 * @param periodSeconds - Wave period in seconds
 * @returns Swell quality with score (1-5), label, and description
 */
export function calculateSwellQuality(
  heightMeters: number | null,
  periodSeconds: number | null
): SwellQuality | null {
  if (heightMeters === null && periodSeconds === null) {
    return null;
  }

  // Calculate steepness
  const steepness = calculateWaveSteepness(heightMeters, periodSeconds);

  // Period score (50% weight) - most critical for wave quality
  let periodScore = 2;
  if (periodSeconds !== null) {
    if (periodSeconds >= 14) {
      periodScore = 5;
    } else if (periodSeconds >= 11) {
      periodScore = 4;
    } else if (periodSeconds >= 8) {
      periodScore = 3;
    } else {
      periodScore = 2;
    }
  }

  // Height score (30% weight) - surfable wave height
  let heightScore = 2;
  if (heightMeters !== null) {
    if (heightMeters >= 1.5) {
      heightScore = 5;
    } else if (heightMeters >= 1.0) {
      heightScore = 4;
    } else if (heightMeters >= 0.6) {
      heightScore = 3;
    } else if (heightMeters >= 0.3) {
      heightScore = 2;
    } else {
      heightScore = 1;
    }
  }

  // Steepness score (20% weight) - wave organization
  let steepnessScore = 3;
  if (steepness !== null) {
    if (steepness < 0.025) {
      steepnessScore = 5;
    } else if (steepness < 0.04) {
      steepnessScore = 4;
    } else if (steepness < 0.055) {
      steepnessScore = 3;
    } else {
      steepnessScore = 2;
    }
  }

  // Weighted score
  const rawScore = periodScore * 0.5 + heightScore * 0.3 + steepnessScore * 0.2;
  const score = Math.max(1, Math.min(5, Math.round(rawScore)));

  // Generate label and description
  let label: SwellQuality['label'];
  let description: string;

  if (heightMeters !== null && heightMeters < 0.3) {
    label = 'Flat';
    description = 'Too small for surfing';
  } else if (score >= 5) {
    label = 'Epic';
    description = 'Clean ground swell with powerful, consistent sets';
  } else if (score >= 4) {
    label = 'Good';
    description = 'Quality swell with good organization';
  } else if (score >= 3) {
    label = 'Fair';
    description = 'Surfable conditions, average wave quality';
  } else {
    label = 'Poor';
    description = 'Short period or choppy conditions';
  }

  return { score, label, description };
}

// ============================================================================
// Set Wave Estimates (Improvement 6)
// ============================================================================

/**
 * Calculate set wave estimates based on significant wave height
 *
 * Significant wave height (Hs) = mean of highest 1/3 of waves
 *
 * Statistical relationships:
 * - Average set: Hs (by definition)
 * - Occasional set (top 10%): ~1.27 × Hs
 * - Sneaker set (top 1%, "wave of the day"): ~1.67 × Hs
 *
 * @param hsMeters - Significant wave height in meters
 * @returns Set wave estimates for different percentiles
 */
export function calculateSetWaveEstimate(hsMeters: number | null): SetWaveEstimate | null {
  if (hsMeters === null) return null;

  return {
    averageSet: hsMeters,
    occasionalSet: hsMeters * 1.27,
    sneakerSet: hsMeters * 1.67,
  };
}

// ============================================================================
// Forecast Confidence (Improvement 7)
// ============================================================================

/**
 * Get forecast confidence based on time horizon
 *
 * Confidence degrades over time:
 * - 0-24h: 95% - Very reliable
 * - 24-72h: 85% - Reliable
 * - 72-120h (3-5 days): 70% - Fairly accurate
 * - 120-168h (5-7 days): 55% - General trend
 * - >168h (7+ days): 35% - Indicative only
 *
 * @param hoursFromNow - Hours into the future
 * @returns Forecast confidence with level, percentage, and label
 */
export function getForecastConfidence(hoursFromNow: number): ForecastConfidence {
  if (hoursFromNow <= 24) {
    return { level: 'high', percentage: 95, label: 'Very reliable' };
  } else if (hoursFromNow <= 72) {
    return { level: 'high', percentage: 85, label: 'Reliable' };
  } else if (hoursFromNow <= 120) {
    return { level: 'medium', percentage: 70, label: 'Fairly accurate' };
  } else if (hoursFromNow <= 168) {
    return { level: 'medium', percentage: 55, label: 'General trend' };
  } else {
    return { level: 'low', percentage: 35, label: 'Indicative only' };
  }
}

/**
 * Calculate hours from now for a given date
 */
export function getHoursFromNow(date: Date): number {
  const now = new Date();
  return Math.max(0, (date.getTime() - now.getTime()) / (1000 * 60 * 60));
}

// ============================================================================
// Bimodal Swell (Improvement 9)
// ============================================================================

export interface BimodalSwell {
  primary: {
    height: number | null;
    period: number | null;
    direction: number | null;
    type: SwellType | null;
  };
  secondary: {
    height: number | null;
    period: number | null;
    direction: number | null;
    type: SwellType | null;
  } | null;
  combined: number | null;
  hasMixedConditions: boolean;
}

/**
 * Analyze bimodal swell conditions
 *
 * When both ground swell and wind swell are present, calculate combined height
 * and identify mixed conditions.
 *
 * Combined height uses energy addition: √(H1² + H2²)
 */
export function analyzeBimodalSwell(
  primaryHeight: number | null,
  primaryPeriod: number | null,
  primaryDirection: number | null,
  secondaryHeight: number | null,
  secondaryPeriod: number | null,
  secondaryDirection: number | null
): BimodalSwell {
  const primaryType = classifySwellType(primaryPeriod);
  const secondaryType = classifySwellType(secondaryPeriod);

  const hasSecondary =
    secondaryHeight !== null &&
    secondaryPeriod !== null &&
    secondaryHeight > 0;

  // Calculate combined height using energy addition
  let combined: number | null = null;
  if (primaryHeight !== null && hasSecondary && secondaryHeight !== null) {
    combined = Math.sqrt(Math.pow(primaryHeight, 2) + Math.pow(secondaryHeight, 2));
  } else if (primaryHeight !== null) {
    combined = primaryHeight;
  }

  // Check for mixed conditions (different swell types)
  const hasMixedConditions =
    hasSecondary &&
    primaryType !== null &&
    secondaryType !== null &&
    primaryType !== secondaryType;

  return {
    primary: {
      height: primaryHeight,
      period: primaryPeriod,
      direction: primaryDirection,
      type: primaryType,
    },
    secondary: hasSecondary
      ? {
          height: secondaryHeight,
          period: secondaryPeriod,
          direction: secondaryDirection,
          type: secondaryType,
        }
      : null,
    combined,
    hasMixedConditions,
  };
}

// ============================================================================
// Composite Wave Analysis
// ============================================================================

export interface WaveAnalysis {
  steepness: number | null;
  steepnessCategory: SteepnessCategory | null;
  swellType: SwellType | null;
  power: WavePowerResult | null;
  surfRange: EnhancedSurfRange | null;
  quality: SwellQuality | null;
  setEstimate: SetWaveEstimate | null;
}

/**
 * Perform complete wave analysis
 *
 * Returns all wave quality metrics for given height and period.
 */
export function analyzeWave(
  heightMeters: number | null,
  periodSeconds: number | null
): WaveAnalysis {
  const steepness = calculateWaveSteepness(heightMeters, periodSeconds);

  return {
    steepness,
    steepnessCategory: categorizeWaveSteepness(steepness),
    swellType: classifySwellType(periodSeconds),
    power: calculateWavePower(heightMeters, periodSeconds),
    surfRange: calculateEnhancedSurfRange(heightMeters, periodSeconds),
    quality: calculateSwellQuality(heightMeters, periodSeconds),
    setEstimate: calculateSetWaveEstimate(heightMeters),
  };
}
