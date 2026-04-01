-- Fix missing primary keys on time-series tables
-- These are needed for ON CONFLICT DO UPDATE to work

-- Add primary key to observations (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'observations' AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE observations ADD PRIMARY KEY (time, break_id);
  END IF;
END $$;

-- Add primary key to weather_forecasts (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'weather_forecasts' AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE weather_forecasts ADD PRIMARY KEY (time, break_id);
  END IF;
END $$;

-- Add primary key to waves (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'waves' AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE waves ADD PRIMARY KEY (time, break_id);
  END IF;
END $$;
