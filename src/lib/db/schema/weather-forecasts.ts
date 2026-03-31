import { pgTable, text, doublePrecision, timestamp, integer, index, primaryKey } from 'drizzle-orm/pg-core';
import { breaks } from './breaks';

export const weatherForecasts = pgTable(
  'weather_forecasts',
  {
    time: timestamp('time', { withTimezone: true }).notNull(),
    breakId: text('break_id')
      .notNull()
      .references(() => breaks.id),
    windSpeed10m: doublePrecision('wind_speed_10m'),
    windGusts10m: doublePrecision('wind_gusts_10m'),
    windDirection10m: integer('wind_direction_10m'), // degrees 0-360
    precipitation: doublePrecision('precipitation'),
  },
  (table) => [
    primaryKey({ columns: [table.time, table.breakId] }),
    index('weather_forecasts_break_id_time_idx').on(table.breakId, table.time),
  ]
);

export type WeatherForecast = typeof weatherForecasts.$inferSelect;
export type NewWeatherForecast = typeof weatherForecasts.$inferInsert;
