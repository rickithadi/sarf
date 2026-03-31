import { pgTable, text, doublePrecision, integer } from 'drizzle-orm/pg-core';

export const breaks = pgTable('breaks', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  region: text('region').notNull(),
  bomStationId: text('bom_station_id').notNull(),
  optimalWindDirection: integer('optimal_wind_direction').notNull(), // degrees (0-360) for offshore
});

export type Break = typeof breaks.$inferSelect;
export type NewBreak = typeof breaks.$inferInsert;
