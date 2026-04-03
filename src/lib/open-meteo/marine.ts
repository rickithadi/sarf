import { z } from 'zod';

const MarineResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  generationtime_ms: z.number(),
  utc_offset_seconds: z.number(),
  timezone: z.string(),
  timezone_abbreviation: z.string(),
  hourly_units: z.object({
    time: z.string(),
    wave_height: z.string(),
    wave_period: z.string(),
    wave_direction: z.string(),
    swell_wave_height: z.string(),
    swell_wave_period: z.string(),
    swell_wave_direction: z.string(),
  }),
  hourly: z.object({
    time: z.array(z.string()),
    wave_height: z.array(z.number().nullable()),
    wave_period: z.array(z.number().nullable()),
    wave_direction: z.array(z.number().nullable()),
    swell_wave_height: z.array(z.number().nullable()),
    swell_wave_period: z.array(z.number().nullable()),
    swell_wave_direction: z.array(z.number().nullable()),
  }),
});

export interface MarineForecastPoint {
  time: Date;
  waveHeight: number | null;
  wavePeriod: number | null;
  waveDirection: number | null;
  swellWaveHeight: number | null;
  swellWavePeriod: number | null;
  swellWaveDirection: number | null;
}

/**
 * Fetch marine/wave forecast from Open-Meteo Marine API
 * @param lat - Latitude
 * @param lng - Longitude
 * @param forecastDays - Number of days to forecast (default 10)
 * @returns Array of hourly marine forecast data
 */
export async function fetchMarineForecast(
  lat: number,
  lng: number,
  forecastDays: number = 10
): Promise<MarineForecastPoint[]> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly: 'wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction',
    timezone: 'Australia/Melbourne',
    forecast_days: forecastDays.toString(),
  });

  const url = `https://marine-api.open-meteo.com/v1/marine?${params}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      console.error(`Open-Meteo marine API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    const parsed = MarineResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error('Open-Meteo marine response validation failed:', parsed.error);
      return [];
    }

    const { hourly } = parsed.data;
    const forecasts: MarineForecastPoint[] = [];

    for (let i = 0; i < hourly.time.length; i++) {
      forecasts.push({
        time: new Date(hourly.time[i]),
        waveHeight: hourly.wave_height[i],
        wavePeriod: hourly.wave_period[i],
        waveDirection: hourly.wave_direction[i],
        swellWaveHeight: hourly.swell_wave_height[i],
        swellWavePeriod: hourly.swell_wave_period[i],
        swellWaveDirection: hourly.swell_wave_direction[i],
      });
    }

    if (forecasts.length > 0) {
      console.log(`[Marine API] Returned ${forecasts.length} hours from ${forecasts[0].time.toISOString()} to ${forecasts[forecasts.length - 1].time.toISOString()}`);
      // Log null counts to detect API data gaps
      const nullCount = forecasts.filter(f => f.waveHeight === null).length;
      if (nullCount > 0) {
        console.log(`[Marine API] WARNING: ${nullCount}/${forecasts.length} hours have null waveHeight`);
      }
    }

    return forecasts;
  } catch (error) {
    console.error('Failed to fetch Open-Meteo marine:', error);
    return [];
  }
}
