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
    uv_index: z.string().optional(),
  }),
  hourly: z.object({
    time: z.array(z.string()),
    wind_speed_10m: z.array(z.number().nullable()),
    wind_gusts_10m: z.array(z.number().nullable()),
    wind_direction_10m: z.array(z.number().nullable()),
    precipitation: z.array(z.number().nullable()),
    uv_index: z.array(z.number().nullable()).optional(),
  }),
  daily_units: z.object({
    time: z.string(),
    sunrise: z.string(),
    sunset: z.string(),
    uv_index_max: z.string(),
  }).optional(),
  daily: z.object({
    time: z.array(z.string()),
    sunrise: z.array(z.string()),
    sunset: z.array(z.string()),
    uv_index_max: z.array(z.number().nullable()),
  }).optional(),
});

export interface WeatherForecastPoint {
  time: Date;
  windSpeed10m: number | null;
  windGusts10m: number | null;
  windDirection10m: number | null;
  precipitation: number | null;
  uvIndex: number | null;
}

export interface DailyWeatherData {
  date: Date;
  sunrise: Date;
  sunset: Date;
  uvIndexMax: number | null;
}

export interface WeatherForecastResult {
  hourly: WeatherForecastPoint[];
  daily: DailyWeatherData[];
}

/**
 * Fetch weather forecast from Open-Meteo API
 * @param lat - Latitude
 * @param lng - Longitude
 * @param forecastDays - Number of days to forecast (default 10)
 * @returns Array of hourly forecast data
 */
export async function fetchWeatherForecast(
  lat: number,
  lng: number,
  forecastDays: number = 10
): Promise<WeatherForecastPoint[]> {
  const result = await fetchWeatherForecastFull(lat, lng, forecastDays);
  return result.hourly;
}

/**
 * Fetch full weather forecast including daily data (sunrise/sunset/UV)
 */
export async function fetchWeatherForecastFull(
  lat: number,
  lng: number,
  forecastDays: number = 10
): Promise<WeatherForecastResult> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly: 'wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation,uv_index',
    daily: 'sunrise,sunset,uv_index_max',
    timezone: 'Australia/Melbourne',
    forecast_days: forecastDays.toString(),
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      console.error(`Open-Meteo weather API error: ${response.status} ${response.statusText}`);
      return { hourly: [], daily: [] };
    }

    const data = await response.json();
    const parsed = WeatherResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error('Open-Meteo weather response validation failed:', parsed.error);
      return { hourly: [], daily: [] };
    }

    const { hourly, daily } = parsed.data;

    // Parse hourly data
    const hourlyForecasts: WeatherForecastPoint[] = [];
    for (let i = 0; i < hourly.time.length; i++) {
      hourlyForecasts.push({
        time: new Date(hourly.time[i]),
        windSpeed10m: hourly.wind_speed_10m[i],
        windGusts10m: hourly.wind_gusts_10m[i],
        windDirection10m: hourly.wind_direction_10m[i],
        precipitation: hourly.precipitation[i],
        uvIndex: hourly.uv_index?.[i] ?? null,
      });
    }

    // Parse daily data
    const dailyData: DailyWeatherData[] = [];
    if (daily) {
      for (let i = 0; i < daily.time.length; i++) {
        dailyData.push({
          date: new Date(daily.time[i]),
          sunrise: new Date(daily.sunrise[i]),
          sunset: new Date(daily.sunset[i]),
          uvIndexMax: daily.uv_index_max[i],
        });
      }
    }

    if (hourlyForecasts.length > 0) {
      console.log(`[Weather API] Returned ${hourlyForecasts.length} hours from ${hourlyForecasts[0].time.toISOString()} to ${hourlyForecasts[hourlyForecasts.length - 1].time.toISOString()}`);
    }

    return { hourly: hourlyForecasts, daily: dailyData };
  } catch (error) {
    console.error('Failed to fetch Open-Meteo weather:', error);
    return { hourly: [], daily: [] };
  }
}

/**
 * Get UV index description and SPF recommendation
 */
export function getUVDescription(uvIndex: number | null): {
  level: 'low' | 'moderate' | 'high' | 'very-high' | 'extreme';
  description: string;
  spfRecommendation: string;
} {
  if (uvIndex === null || uvIndex < 0) {
    return { level: 'low', description: 'N/A', spfRecommendation: '' };
  }

  if (uvIndex < 3) {
    return {
      level: 'low',
      description: 'Low',
      spfRecommendation: 'SPF 15+',
    };
  }

  if (uvIndex < 6) {
    return {
      level: 'moderate',
      description: 'Moderate',
      spfRecommendation: 'SPF 30+',
    };
  }

  if (uvIndex < 8) {
    return {
      level: 'high',
      description: 'High',
      spfRecommendation: 'SPF 30+, seek shade',
    };
  }

  if (uvIndex < 11) {
    return {
      level: 'very-high',
      description: 'Very High',
      spfRecommendation: 'SPF 50+, limit exposure',
    };
  }

  return {
    level: 'extreme',
    description: 'Extreme',
    spfRecommendation: 'SPF 50+, avoid midday sun',
  };
}
