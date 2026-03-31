# Surf Forecast App Implementation Plan

## Status: Implementation Complete - Database Setup In Progress

## Overview
Greenfield Australian surf forecast web app using Next.js 14, PostgreSQL + TimescaleDB, Drizzle ORM, and Claude API for AI-generated surf reports. MVP focuses on 6 Victorian surf breaks.

## Current Progress
- [x] Project initialized in `/Users/hadi.rickit/dev/sarf/`
- [x] All source files created (schemas, fetchers, API routes, pages)
- [x] Build passes (`npm run build`)
- [x] Database tables created (`npm run db:push`)
- [ ] **NEXT: Seed database** (`npm run db:seed`)
- [ ] Start dev server (`npm run dev`)
- [ ] Test cron endpoints
- [ ] Configure Upstash Redis (optional for MVP)
- [ ] Configure Anthropic API key (for AI reports)

---

## Phase 1: Project Setup

### 1.1 Initialize Project ✅
```bash
npx create-next-app@14 surf-app --typescript --tailwind --eslint --app --src-dir
npm install drizzle-orm postgres @upstash/redis @anthropic-ai/sdk zod date-fns dotenv
npm install -D drizzle-kit @types/node tsx
```

### 1.2 Configuration Files ✅
- `.env` - Environment variables (DATABASE_URL, UPSTASH_REDIS_*, ANTHROPIC_API_KEY, CRON_SECRET)
- `vercel.json` - Cron schedules (10min observations, 3h weather, 6h waves, daily tides)
- `drizzle.config.ts` - Drizzle ORM configuration

---

## Phase 2: Database Schema ✅

### 2.1 Tables (Drizzle)
| Table | Type | Purpose |
|-------|------|---------|
| `breaks` | Regular | Surf break reference data (6 VIC breaks) |
| `observations` | Hypertable | BOM weather observations |
| `weather_forecasts` | Hypertable | Open-Meteo wind forecasts |
| `waves` | Hypertable | Open-Meteo marine forecasts |
| `tides` | Regular | Tide events (high/low) |

### 2.2 Files Created ✅
- `src/lib/db/index.ts` - Database connection
- `src/lib/db/schema/breaks.ts` - Breaks table
- `src/lib/db/schema/observations.ts` - Observations hypertable
- `src/lib/db/schema/weather-forecasts.ts` - Weather forecast hypertable
- `src/lib/db/schema/waves.ts` - Wave forecast hypertable
- `src/lib/db/schema/tides.ts` - Tide events table
- `src/lib/db/seed.ts` - Seed 6 VIC breaks
- `drizzle/custom/001_create_hypertables.sql` - TimescaleDB extension + hypertable creation

---

## Phase 3: Data Fetchers ✅

### 3.1 BOM Observations
- **File**: `src/lib/bom/observations.ts`
- **URL**: `http://www.bom.gov.au/fwo/IDV60901/IDV60901.{station_id}.json`
- **Fields**: air_temp, wind_spd_kmh, gust_kmh, wind_dir, press, rel_hum

### 3.2 Open-Meteo Weather (BOM wrapper)
- **File**: `src/lib/open-meteo/weather.ts`
- **URL**: `https://api.open-meteo.com/v1/bom`
- **Fields**: wind_speed_10m, wind_gusts_10m, wind_direction_10m, precipitation

### 3.3 Open-Meteo Marine (wave forecasts)
- **File**: `src/lib/open-meteo/marine.ts`
- **URL**: `https://marine-api.open-meteo.com/v1/marine`
- **Fields**: wave_height, wave_period, wave_direction, swell_wave_height/period/direction

### 3.4 Tides (BOM + WorldTides fallback)
- **File**: `src/lib/bom/tides.ts`
- **File**: `src/lib/worldtides/client.ts`

---

## Phase 4: Cron Jobs ✅

### 4.1 Cron Auth
- **File**: `src/lib/cron/auth.ts`
- Verify `Authorization: Bearer ${CRON_SECRET}` header

### 4.2 Cron Routes
| Route | Schedule | Purpose |
|-------|----------|---------|
| `/api/cron/observations` | `*/10 * * * *` | Fetch BOM observations |
| `/api/cron/weather` | `0 */3 * * *` | Fetch Open-Meteo weather |
| `/api/cron/waves` | `0 */6 * * *` | Fetch Open-Meteo marine |
| `/api/cron/tides` | `0 6 * * *` | Fetch tide events |

---

## Phase 5: Claude Integration ✅

### 5.1 Wind Quality Pre-computation
- **File**: `src/lib/breaks/wind-quality.ts`
- Calculate offshore/onshore/cross-shore BEFORE sending to Claude
- Compare wind direction vs break's optimal offshore direction

### 5.2 Report Generator
- **File**: `src/lib/claude/client.ts` - Anthropic SDK client
- **File**: `src/lib/claude/prompts.ts` - System prompt for surf reports
- **File**: `src/lib/claude/report-generator.ts` - Generate reports with 30-min Upstash Redis cache
- **File**: `src/lib/cache/redis.ts` - Upstash Redis client wrapper

### 5.3 Claude Response Schema
```typescript
{
  rating: 1-5,
  headline: string,      // Brief catchy summary
  conditions: string,    // Current conditions paragraph
  forecast: string,      // Next 12-24h outlook
  bestTime: string       // Optimal surf window
}
```

---

## Phase 6: API Routes ✅

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/breaks` | GET | List all breaks with current ratings |
| `/api/breaks/[id]` | GET | Break details |
| `/api/breaks/[id]/report` | GET | Claude-generated surf report |
| `/api/breaks/[id]/conditions` | GET | Raw conditions data |

---

## Phase 7: Frontend Pages ✅

### 7.1 Layout & Components
- `src/app/(site)/layout.tsx` - Site layout with header
- `src/components/layout/header.tsx` - Navigation
- `src/components/layout/bom-attribution.tsx` - **Required** BOM copyright notice
- `src/components/ui/rating-badge.tsx` - 1-5 star display
- `src/components/breaks/break-card.tsx` - Break list card

### 7.2 Pages
- `src/app/(site)/page.tsx` - Home: break list with rating badges
- `src/app/(site)/[breakId]/page.tsx` - Break detail: Claude report + conditions

---

## Phase 8: Verification

### 8.1 Database
- [x] Tables created via Drizzle
- [ ] TimescaleDB extension enabled (optional for MVP)
- [ ] Hypertables created (optional for MVP)
- [ ] 6 VIC breaks seeded

### 8.2 Cron Jobs
- [ ] Test each endpoint with curl + CRON_SECRET
- [ ] Verify 401 response without auth
- [ ] Confirm data persists to database

### 8.3 Claude Integration
- [ ] Reports generate correctly
- [ ] 30-minute cache working (check Upstash Redis)
- [ ] JSON response parses without errors

### 8.4 Frontend
- [ ] Break list renders on home page
- [ ] Detail page shows Claude report
- [ ] BOM attribution visible on all pages

---

## Environment Variables Required

```env
DATABASE_URL=postgresql://localhost:5432/surfapp
UPSTASH_REDIS_REST_URL=https://...        # Optional for MVP
UPSTASH_REDIS_REST_TOKEN=...              # Optional for MVP
ANTHROPIC_API_KEY=sk-ant-...              # Required for AI reports
CRON_SECRET=...                           # Required for cron endpoints
WORLDTIDES_API_KEY=...                    # Optional fallback
```

---

## Quick Start Commands

```bash
# 1. Create database (requires PostgreSQL)
createdb surfapp

# 2. Set environment variable
echo 'DATABASE_URL=postgresql://localhost:5432/surfapp' > .env

# 3. Push schema to database
npm run db:push

# 4. Seed surf breaks
npm run db:seed

# 5. Start development server
npm run dev

# 6. Test cron endpoint (requires CRON_SECRET in .env)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/observations
```

---

## Key Technical Notes

1. **TimescaleDB**: Optional for MVP - tables work as regular PostgreSQL
2. **Wind quality**: Pre-compute offshore/onshore before Claude to reduce tokens
3. **Cache**: 30-minute TTL on Claude reports via Upstash Redis
4. **BOM attribution**: Required on all pages displaying BOM data
5. **Cron auth**: Verify CRON_SECRET header on all cron routes
