import { pgTable, text, doublePrecision, timestamp, integer, index, primaryKey } from 'drizzle-orm/pg-core';
import { breaks } from './breaks';

export const waves = pgTable(
  'waves',
  {
    time: timestamp('time', { withTimezone: true }).notNull(),
    breakId: text('break_id')
      .notNull()
      .references(() => breaks.id),
    waveHeight: doublePrecision('wave_height'),
    wavePeriod: doublePrecision('wave_period'),
    waveDirection: integer('wave_direction'), // degrees 0-360
    swellWaveHeight: doublePrecision('swell_wave_height'),
    swellWavePeriod: doublePrecision('swell_wave_period'),
    swellWaveDirection: integer('swell_wave_direction'), // degrees 0-360
  },
  (table) => [
    primaryKey({ columns: [table.time, table.breakId] }),
    index('waves_break_id_time_idx').on(table.breakId, table.time),
  ]
);

export type Wave = typeof waves.$inferSelect;
export type NewWave = typeof waves.$inferInsert;
