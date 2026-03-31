import { pgTable, text, doublePrecision, timestamp, index, serial } from 'drizzle-orm/pg-core';
import { breaks } from './breaks';

export const tides = pgTable(
  'tides',
  {
    id: serial('id').primaryKey(),
    time: timestamp('time', { withTimezone: true }).notNull(),
    breakId: text('break_id')
      .notNull()
      .references(() => breaks.id),
    type: text('type').notNull(), // 'high' or 'low'
    height: doublePrecision('height').notNull(), // meters
  },
  (table) => [
    index('tides_break_id_time_idx').on(table.breakId, table.time),
  ]
);

export type Tide = typeof tides.$inferSelect;
export type NewTide = typeof tides.$inferInsert;
