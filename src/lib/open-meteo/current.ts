import { z } from 'zod';

const CurrentWeatherResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  generationtime_ms: z.number(),
  utc_offset_seconds: z.number(),
  timezone: z.string(),
  timezone_abbreviation: z.string(),
  elevation: z.number(),
  current_units: z.object({
    time: z.string(),
    temperature_2m: z.string(),
    relative_humidity_2m: z.string(),
    surface_pressure: z.string(),
    wind_speed_10m: z.string(),
    wind_gusts_10m: z.string(),
    wind_direction_10m: z.string(),
  }),
  current: z.object({
    time: z.string(),
    temperature_2m: z.number().nullable(),
    relative_humidity_2m: z.number().nullable(),
    surface_pressure: z.number().nullable(),
    wind_speed_10m: z.number().nullable(),
    wind_gusts_10m: z.number().nullable(),
    wind_direction_10m: z.number().nullable(),
  }),
});

export interface CurrentConditions {
  time: Date;
  airTemp: number | null;
  windSpeedKmh: number | null;
  gustKmh: number | null;
  windDir: number | null;
  pressure: number | null;
  humidity: number | null;
}

/**
 * Fetch current weather conditions from Open-Meteo
 * This serves as a fallback when BOM API is unavailable
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Current weather conditions
 */
export async function fetchCurrentConditions(
  lat: number,
  lng: number
): Promise<CurrentConditions | null> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    current: 'temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_gusts_10m,wind_direction_10m',
    timezone: 'Australia/Melbourne',
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      console.error(`Open-Meteo current API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const parsed = CurrentWeatherResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error('Open-Meteo current response validation failed:', parsed.error);
      return null;
    }

    const { current } = parsed.data;

    return {
      time: new Date(current.time),
      airTemp: current.temperature_2m,
      windSpeedKmh: current.wind_speed_10m,
      gustKmh: current.wind_gusts_10m,
      windDir: current.wind_direction_10m,
      pressure: current.surface_pressure,
      humidity: current.relative_humidity_2m,
    };
  } catch (error) {
    console.error('Failed to fetch Open-Meteo current conditions:', error);
    return null;
  }
}
