import 'dotenv/config';
import { fetchBomObservations } from './bom/observations';
import { fetchWeatherForecast } from './open-meteo/weather';
import { fetchMarineForecast } from './open-meteo/marine';
import { fetchCurrentConditions } from './open-meteo/current';
import { fetchWorldTides } from './worldtides/client';

// Test coordinates for Bells Beach
const BELLS_BEACH = {
  lat: -38.3686,
  lng: 144.2811,
  bomStationId: '95890', // Aireys Inlet
};

async function testFetchers() {
  console.log('=== Testing Data Fetchers ===\n');

  // Test BOM Observations
  console.log('1. Testing BOM Observations...');
  try {
    const obs = await fetchBomObservations(BELLS_BEACH.bomStationId);
    if (obs) {
      console.log('   ✓ BOM Observations working');
      console.log(`   - Time: ${obs.time.toISOString()}`);
      console.log(`   - Air Temp: ${obs.airTemp}°C`);
      console.log(`   - Wind: ${obs.windSpeedKmh} km/h, direction: ${obs.windDir}°`);
      console.log(`   - Gusts: ${obs.gustKmh} km/h`);
      console.log(`   - Pressure: ${obs.pressure} hPa`);
      console.log(`   - Humidity: ${obs.humidity}%`);
    } else {
      console.log('   ✗ BOM Observations returned null (403 blocked?)');
    }
  } catch (error) {
    console.log('   ✗ BOM Observations failed:', error);
  }

  console.log('');

  // Test Open-Meteo Current (fallback for BOM)
  console.log('1b. Testing Open-Meteo Current Conditions (BOM fallback)...');
  try {
    const current = await fetchCurrentConditions(BELLS_BEACH.lat, BELLS_BEACH.lng);
    if (current) {
      console.log('   ✓ Open-Meteo Current working');
      console.log(`   - Time: ${current.time.toISOString()}`);
      console.log(`   - Air Temp: ${current.airTemp}°C`);
      console.log(`   - Wind: ${current.windSpeedKmh} km/h, direction: ${current.windDir}°`);
      console.log(`   - Gusts: ${current.gustKmh} km/h`);
      console.log(`   - Pressure: ${current.pressure} hPa`);
      console.log(`   - Humidity: ${current.humidity}%`);
    } else {
      console.log('   ✗ Open-Meteo Current returned null');
    }
  } catch (error) {
    console.log('   ✗ Open-Meteo Current failed:', error);
  }

  console.log('');

  // Test Open-Meteo Weather
  console.log('2. Testing Open-Meteo Weather Forecast...');
  try {
    const weather = await fetchWeatherForecast(BELLS_BEACH.lat, BELLS_BEACH.lng, 1);
    if (weather.length > 0) {
      console.log(`   ✓ Open-Meteo Weather working (${weather.length} hourly points)`);
      const first = weather[0];
      console.log(`   - First forecast: ${first.time.toISOString()}`);
      console.log(`   - Wind: ${first.windSpeed10m} km/h, direction: ${first.windDirection10m}°`);
      console.log(`   - Gusts: ${first.windGusts10m} km/h`);
      console.log(`   - Precipitation: ${first.precipitation} mm`);
    } else {
      console.log('   ✗ Open-Meteo Weather returned empty array');
    }
  } catch (error) {
    console.log('   ✗ Open-Meteo Weather failed:', error);
  }

  console.log('');

  // Test Open-Meteo Marine
  console.log('3. Testing Open-Meteo Marine Forecast...');
  try {
    const marine = await fetchMarineForecast(BELLS_BEACH.lat, BELLS_BEACH.lng, 1);
    if (marine.length > 0) {
      console.log(`   ✓ Open-Meteo Marine working (${marine.length} hourly points)`);
      const first = marine[0];
      console.log(`   - First forecast: ${first.time.toISOString()}`);
      console.log(`   - Wave height: ${first.waveHeight}m, period: ${first.wavePeriod}s`);
      console.log(`   - Swell height: ${first.swellWaveHeight}m, period: ${first.swellWavePeriod}s`);
    } else {
      console.log('   ✗ Open-Meteo Marine returned empty array');
    }
  } catch (error) {
    console.log('   ✗ Open-Meteo Marine failed:', error);
  }

  console.log('');

  // Test WorldTides (optional - needs API key)
  console.log('4. Testing WorldTides...');
  if (!process.env.WORLDTIDES_API_KEY) {
    console.log('   ⊘ Skipped (WORLDTIDES_API_KEY not configured)');
  } else {
    try {
      const tides = await fetchWorldTides(BELLS_BEACH.lat, BELLS_BEACH.lng, 2);
      if (tides.length > 0) {
        console.log(`   ✓ WorldTides working (${tides.length} tide events)`);
        tides.slice(0, 4).forEach((t) => {
          console.log(`   - ${t.type} tide at ${t.time.toISOString()} (${t.height.toFixed(2)}m)`);
        });
      } else {
        console.log('   ✗ WorldTides returned empty array');
      }
    } catch (error) {
      console.log('   ✗ WorldTides failed:', error);
    }
  }

  console.log('\n=== Fetcher Tests Complete ===');
}

testFetchers().catch(console.error);
