import { pgTable, text, doublePrecision, integer, json } from 'drizzle-orm/pg-core';

/**
 * Break type for bathymetry calculations
 * - beach: Sandy bottom, shifting sandbars
 * - reef: Coral or rock reef, consistent shape
 * - point: Point break, wave wraps around headland
 */
export type BreakType = 'beach' | 'reef' | 'point';

/**
 * Bathymetry characteristics for nearshore wave transformation
 *
 * Good nearshore models account for shoaling, refraction due to current and depth,
 * bottom friction, and depth-induced breaking.
 */
export interface BreakBathymetry {
  /** Break type affects wave behavior */
  type: BreakType;
  /** Optimal swell directions in degrees (0-360) */
  exposedToSwell: number[];
  /** Wave amplification factor (1.0 = no change, 1.3 = 30% bigger at break) */
  waveAmplification: number;
  /** Whether shallow water effects significantly impact the break */
  shallowWaterEffect: boolean;
}

export const breaks = pgTable('breaks', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  region: text('region').notNull(),
  bomStationId: text('bom_station_id').notNull(),
  optimalWindDirection: integer('optimal_wind_direction').notNull(), // degrees (0-360) for offshore
  // Bathymetry fields for wave transformation (Improvement 8)
  breakType: text('break_type').$type<BreakType>(), // 'beach' | 'reef' | 'point'
  waveAmplification: doublePrecision('wave_amplification'), // 1.0 = no change
  bathymetry: json('bathymetry').$type<BreakBathymetry>(), // Full bathymetry data
});

export type Break = typeof breaks.$inferSelect;
export type NewBreak = typeof breaks.$inferInsert;

/**
 * Default bathymetry values for different break types
 */
export const defaultBathymetry: Record<BreakType, Partial<BreakBathymetry>> = {
  beach: {
    type: 'beach',
    waveAmplification: 1.0,
    shallowWaterEffect: true,
  },
  reef: {
    type: 'reef',
    waveAmplification: 1.1,
    shallowWaterEffect: true,
  },
  point: {
    type: 'point',
    waveAmplification: 1.2,
    shallowWaterEffect: false,
  },
};

/**
 * Get wave transformation notes based on break type
 */
export function getWaveTransformationNotes(type: BreakType | null | undefined): string {
  switch (type) {
    case 'beach':
      return 'Beach break - wave shape varies with shifting sandbars, multiple peaks possible';
    case 'reef':
      return 'Reef break - consistent wave shape, breaks in same spot, can be shallow';
    case 'point':
      return 'Point break - waves wrap around headland, long rides possible, wave focusing effect';
    default:
      return 'Wave characteristics depend on local bathymetry';
  }
}
