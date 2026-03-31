import { z } from 'zod';

const BomObservationSchema = z.object({
  sort_order: z.number(),
  wmo: z.number(),
  name: z.string(),
  history_product: z.string(),
  local_date_time: z.string(),
  local_date_time_full: z.string(),
  aifstime_utc: z.string(),
  lat: z.number(),
  lon: z.number(),
  apparent_t: z.number().nullable(),
  cloud: z.string().nullable(),
  cloud_base_m: z.number().nullable(),
  cloud_oktas: z.number().nullable(),
  cloud_type: z.string().nullable(),
  cloud_type_id: z.number().nullable(),
  delta_t: z.number().nullable(),
  gust_kmh: z.number().nullable(),
  gust_kt: z.number().nullable(),
  air_temp: z.number().nullable(),
  dewpt: z.number().nullable(),
  press: z.number().nullable(),
  press_msl: z.number().nullable(),
  press_qnh: z.number().nullable(),
  press_tend: z.string().nullable(),
  rain_trace: z.string().nullable(),
  rel_hum: z.number().nullable(),
  sea_state: z.string().nullable(),
  swell_dir_worded: z.string().nullable(),
  swell_height: z.number().nullable(),
  swell_period: z.number().nullable(),
  vis_km: z.string().nullable(),
  weather: z.string().nullable(),
  wind_dir: z.string().nullable(),
  wind_spd_kmh: z.number().nullable(),
  wind_spd_kt: z.number().nullable(),
});

const BomResponseSchema = z.object({
  observations: z.object({
    notice: z.array(z.object({ copyright: z.string(), copyright_url: z.string(), disclaimer_url: z.string(), feedback_url: z.string() })),
    header: z.array(z.object({
      refresh_message: z.string(),
      ID: z.string(),
      main_ID: z.string(),
      name: z.string(),
      state_time_zone: z.string(),
      time_zone: z.string(),
      product_name: z.string(),
      state: z.string(),
    })),
    data: z.array(BomObservationSchema),
  }),
});

export type BomObservation = z.infer<typeof BomObservationSchema>;

/**
 * Convert wind direction string (e.g., "NW", "SSE") to degrees
 */
function windDirectionToDegrees(dir: string | null): number | null {
  if (!dir) return null;

  const directions: Record<string, number | null> = {
    N: 0,
    NNE: 22.5,
    NE: 45,
    ENE: 67.5,
    E: 90,
    ESE: 112.5,
    SE: 135,
    SSE: 157.5,
    S: 180,
    SSW: 202.5,
    SW: 225,
    WSW: 247.5,
    W: 270,
    WNW: 292.5,
    NW: 315,
    NNW: 337.5,
    CALM: null,
  };

  const upperDir = dir.toUpperCase();
  if (upperDir in directions) {
    return directions[upperDir];
  }
  return null;
}

export interface ParsedObservation {
  time: Date;
  airTemp: number | null;
  windSpeedKmh: number | null;
  gustKmh: number | null;
  windDir: number | null;
  pressure: number | null;
  humidity: number | null;
}

/**
 * Fetch observations from BOM for a given station
 * @param stationId - BOM station ID (e.g., "95890")
 * @returns Latest observation data
 */
export async function fetchBomObservations(stationId: string): Promise<ParsedObservation | null> {
  const url = `http://www.bom.gov.au/fwo/IDV60901/IDV60901.${stationId}.json`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SurfForecastApp/1.0',
      },
      next: { revalidate: 0 }, // Don't cache
    });

    if (!response.ok) {
      console.error(`BOM API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const parsed = BomResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error('BOM response validation failed:', parsed.error);
      return null;
    }

    const latest = parsed.data.observations.data[0];
    if (!latest) {
      return null;
    }

    // Parse the UTC time string (format: "20240315153000")
    const timeStr = latest.aifstime_utc;
    const year = parseInt(timeStr.slice(0, 4));
    const month = parseInt(timeStr.slice(4, 6)) - 1;
    const day = parseInt(timeStr.slice(6, 8));
    const hour = parseInt(timeStr.slice(8, 10));
    const minute = parseInt(timeStr.slice(10, 12));
    const second = parseInt(timeStr.slice(12, 14));

    return {
      time: new Date(Date.UTC(year, month, day, hour, minute, second)),
      airTemp: latest.air_temp,
      windSpeedKmh: latest.wind_spd_kmh,
      gustKmh: latest.gust_kmh,
      windDir: windDirectionToDegrees(latest.wind_dir),
      pressure: latest.press_msl ?? latest.press,
      humidity: latest.rel_hum,
    };
  } catch (error) {
    console.error('Failed to fetch BOM observations:', error);
    return null;
  }
}
