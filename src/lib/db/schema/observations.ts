import { pgTable, text, doublePrecision, timestamp, integer, index, primaryKey } from 'drizzle-orm/pg-core';
import { breaks } from './breaks';

export const observations = pgTable(
  'observations',
  {
    time: timestamp('time', { withTimezone: true }).notNull(),
    breakId: text('break_id')
      .notNull()
      .references(() => breaks.id),
    airTemp: doublePrecision('air_temp'),
    windSpeedKmh: doublePrecision('wind_speed_kmh'),
    gustKmh: doublePrecision('gust_kmh'),
    windDir: integer('wind_dir'), // degrees 0-360
    pressure: doublePrecision('pressure'),
    humidity: doublePrecision('humidity'),
  },
  (table) => [
    primaryKey({ columns: [table.time, table.breakId] }),
    index('observations_break_id_time_idx').on(table.breakId, table.time),
  ]
);

export type Observation = typeof observations.$inferSelect;
export type NewObservation = typeof observations.$inferInsert;
