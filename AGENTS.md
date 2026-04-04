# Repository Guidelines

## Project Structure & Module Organization
Source lives under `src/`: routing/UI in `src/app/(site)` and API handlers in `src/app/api`, shared UI in `src/components`, and business/data code under `src/lib` (subfolders for `db`, `cron`, fetchers, and utilities). Database schema snapshots and migrations are stored in `drizzle/` and configured through `drizzle.config.ts`. Deployment artifacts sit at the repo root (`next.config.mjs`, `tailwind.config.ts`, `vercel.json`), while automation helpers live in `scripts/` (e.g., `run-crons.sh`).

## Build, Test, and Development Commands
Use `npm run dev` for the live-reloading Next.js app, and `npm run build` followed by `npm run start` to exercise the production bundle. `npm run lint` runs `next lint` with the shared ESLint config. Database flows rely on Drizzle helpers: `npm run db:generate` (SQL snapshots), `npm run db:migrate` (apply), `npm run db:push` (schema sync), `npm run db:seed` (fixtures in `src/lib/db/seed.ts`), `npm run db:fix-pks` (sequence repair), and `npm run db:studio` (visual inspect). Fetcher smoke tests live at `src/lib/test-fetchers.ts` and run via `npm run test:fetchers`.

## Coding Style & Naming Conventions
Write TypeScript/TSX with 2-space indentation and prefer functional React components. Use Tailwind classes in-place; shared tokens live in `src/app/globals.css` and `tailwind.config.ts`. Export shared hooks/helpers from barrel files in `src/lib/utils.ts` to keep imports flat. Name files by responsibility (`break-card.tsx`, `tide-fetcher.ts`) and keep Drizzle tables singular. Run `npm run lint` before opening a PR; lint failures block review.

## Testing Guidelines
Add lightweight unit tests next to the code (`foo.test.ts`) until a fuller harness exists. Keep the fetcher verification script (`npm run test:fetchers`) current whenever you add or modify a provider. For critical cron or DB flows, document the manual reproduction steps (commands, seed data) inside the PR so reviewers can replay them. Aim for scenario coverage rather than numeric thresholds.

## Commit & Pull Request Guidelines
Commits follow short, imperative subjects (`fix tide offsets`, `add 10 day forecasts`); avoid stuffing unrelated edits into the same change. PRs should call out intent, manual/test commands run, and any linked issue. Include environment impacts (new `.env` keys for Mapbox or Anthropic) and screenshots for UI-facing updates.

## Security & Configuration Tips
Keep secrets in `.env.local` (`DATABASE_URL`, `ANTHROPIC_API_KEY`, `MAPBOX_TOKEN`, etc.) and never commit them. Rotate keys referenced in `src/lib/claude` or cron jobs if exposure is suspected. When running scheduled scripts (`scripts/run-crons.sh`), prefer read-only DB roles in staging and redact any PII stored under `logs/` before sharing traces.
