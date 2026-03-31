import { z } from 'zod';

const WeatherResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  generationtime_ms: z.number(),
  utc_offset_seconds: z.number(),
  timezone: z.string(),
  timezone_abbreviation: z.string(),
  elevation: z.number(),
  hourly_units: z.object({
    time: z.string(),
    wind_speed_10m: z.string(),
    wind_gusts_10m: z.string(),
    wind_direction_10m: z.string(),
    precipitation: z.string(),
  }),
  hourly: z.object({
    time: z.array(z.string()),
    wind_speed_10m: z.array(z.number().nullable()),
    wind_gusts_10m: z.array(z.number().nullable()),
    wind_direction_10m: z.array(z.number().nullable()),
    precipitation: z.array(z.number().nullable()),
  }),
});

export interface WeatherForecastPoint {
  time: Date;
  windSpeed10m: number | null;
  windGusts10m: number | null;
  windDirection10m: number | null;
  precipitation: number | null;
}

/**
 * Fetch weather forecast from Open-Meteo BOM API
 * @param lat - Latitude
 * @param lng - Longitude
 * @param forecastDays - Number of days to forecast (default 3)
 * @returns Array of hourly forecast data
 */
export async function fetchWeatherForecast(
  lat: number,
  lng: number,
  forecastDays: number = 3
): Promise<WeatherForecastPoint[]> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly: 'wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation',
    timezone: 'Australia/Melbourne',
    forecast_days: forecastDays.toString(),
  });

  // Use standard forecast API (BOM wrapper often returns nulls)
  const url = `https://api.open-meteo.com/v1/forecast?${params}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      console.error(`Open-Meteo weather API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    const parsed = WeatherResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error('Open-Meteo weather response validation failed:', parsed.error);
      return [];
    }

    const { hourly } = parsed.data;
    const forecasts: WeatherForecastPoint[] = [];

    for (let i = 0; i < hourly.time.length; i++) {
      forecasts.push({
        time: new Date(hourly.time[i]),
        windSpeed10m: hourly.wind_speed_10m[i],
        windGusts10m: hourly.wind_gusts_10m[i],
        windDirection10m: hourly.wind_direction_10m[i],
        precipitation: hourly.precipitation[i],
      });
    }

    return forecasts;
  } catch (error) {
    console.error('Failed to fetch Open-Meteo weather:', error);
    return [];
  }
}
