import { pgTable, text, doublePrecision, integer, timestamp } from 'drizzle-orm/pg-core';
import { breaks } from './breaks';

export const reports = pgTable('reports', {
  breakId: text('break_id')
    .primaryKey()
    .references(() => breaks.id),
  rating: integer('rating').notNull(),
  headline: text('headline').notNull(),
  conditions: text('conditions').notNull(),
  forecast: text('forecast').notNull(),
  bestTime: text('best_time').notNull(),
  bestConditions: text('best_conditions').notNull(),
  generatedAt: timestamp('generated_at', { withTimezone: true }).notNull(),
});

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
