#!/bin/bash
#
# Run all cron jobs to refresh data, then generate reports
#
# Usage: ./scripts/run-crons.sh [base_url]
#
# Example:
#   ./scripts/run-crons.sh                    # Uses localhost:3000
#   ./scripts/run-crons.sh https://sarf.app   # Uses production URL

BASE_URL="${1:-http://localhost:3000}"

echo "======================================"
echo "Running cron jobs against: $BASE_URL"
echo "======================================"
echo ""

# Data fetching cron jobs (run in parallel for speed)
echo "1. Fetching observations..."
curl -s "$BASE_URL/api/cron/observations" &
OBS_PID=$!

echo "2. Fetching waves..."
curl -s "$BASE_URL/api/cron/waves" &
WAVES_PID=$!

echo "3. Fetching weather..."
curl -s "$BASE_URL/api/cron/weather" &
WEATHER_PID=$!

echo "4. Fetching tides..."
curl -s "$BASE_URL/api/cron/tides" &
TIDES_PID=$!

# Wait for all data jobs to complete
echo ""
echo "Waiting for data jobs to complete..."
wait $OBS_PID
echo "  - Observations: done"
wait $WAVES_PID
echo "  - Waves: done"
wait $WEATHER_PID
echo "  - Weather: done"
wait $TIDES_PID
echo "  - Tides: done"

echo ""
echo "======================================"
echo "5. Generating reports..."
echo "======================================"
curl -s "$BASE_URL/api/cron/reports"

echo ""
echo ""
echo "======================================"
echo "All cron jobs completed!"
echo "======================================"
