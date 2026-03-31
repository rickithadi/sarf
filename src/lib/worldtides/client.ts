import { z } from 'zod';

const WorldTidesExtremeSchema = z.object({
  dt: z.number(),
  date: z.string(),
  height: z.number(),
  type: z.string(), // "High" or "Low"
});

const WorldTidesResponseSchema = z.object({
  status: z.number(),
  callCount: z.number(),
  copyright: z.string(),
  requestLat: z.number(),
  requestLon: z.number(),
  responseLat: z.number(),
  responseLon: z.number(),
  atlas: z.string(),
  station: z.string().optional(),
  extremes: z.array(WorldTidesExtremeSchema),
});

export interface TideEvent {
  time: Date;
  type: 'high' | 'low';
  height: number;
}

/**
 * Fetch tide predictions from WorldTides API
 * @param lat - Latitude
 * @param lng - Longitude
 * @param days - Number of days of predictions (default 7)
 * @returns Array of tide events
 */
export async function fetchWorldTides(
  lat: number,
  lng: number,
  days: number = 7
): Promise<TideEvent[]> {
  const apiKey = process.env.WORLDTIDES_API_KEY;
  if (!apiKey) {
    console.error('WORLDTIDES_API_KEY not configured');
    return [];
  }

  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lng.toString(),
    extremes: '',
    days: days.toString(),
    key: apiKey,
  });

  const url = `https://www.worldtides.info/api/v3?${params}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      console.error(`WorldTides API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    const parsed = WorldTidesResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error('WorldTides response validation failed:', parsed.error);
      return [];
    }

    return parsed.data.extremes.map((extreme) => ({
      time: new Date(extreme.dt * 1000),
      type: extreme.type.toLowerCase() === 'high' ? 'high' : 'low',
      height: extreme.height,
    }));
  } catch (error) {
    console.error('Failed to fetch WorldTides:', error);
    return [];
  }
}
