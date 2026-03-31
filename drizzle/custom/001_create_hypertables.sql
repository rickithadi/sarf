-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert observations to hypertable
SELECT create_hypertable(
  'observations',
  'time',
  if_not_exists => TRUE,
  migrate_data => TRUE
);

-- Convert weather_forecasts to hypertable
SELECT create_hypertable(
  'weather_forecasts',
  'time',
  if_not_exists => TRUE,
  migrate_data => TRUE
);

-- Convert waves to hypertable
SELECT create_hypertable(
  'waves',
  'time',
  if_not_exists => TRUE,
  migrate_data => TRUE
);

-- Set compression policy (compress chunks older than 7 days)
ALTER TABLE observations SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'break_id'
);
SELECT add_compression_policy('observations', INTERVAL '7 days', if_not_exists => TRUE);

ALTER TABLE weather_forecasts SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'break_id'
);
SELECT add_compression_policy('weather_forecasts', INTERVAL '7 days', if_not_exists => TRUE);

ALTER TABLE waves SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'break_id'
);
SELECT add_compression_policy('waves', INTERVAL '7 days', if_not_exists => TRUE);

-- Set retention policy (drop data older than 30 days)
SELECT add_retention_policy('observations', INTERVAL '30 days', if_not_exists => TRUE);
SELECT add_retention_policy('weather_forecasts', INTERVAL '30 days', if_not_exists => TRUE);
SELECT add_retention_policy('waves', INTERVAL '30 days', if_not_exists => TRUE);
