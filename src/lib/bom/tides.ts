import { z } from 'zod';

// BOM tide data structure (simplified - actual BOM tide data varies by location)
const BomTideEventSchema = z.object({
  time: z.string(),
  type: z.enum(['high', 'low']),
  height: z.number(),
});

export interface TideEvent {
  time: Date;
  type: 'high' | 'low';
  height: number;
}

// BOM tide station IDs for Victorian locations
// Note: BOM tide predictions are location-specific and may need adjustment
const TIDE_STATIONS: Record<string, string> = {
  'bells-beach': 'torquay', // Use Torquay tide data
  'jan-juc': 'torquay',
  'torquay': 'torquay',
  'point-leo': 'westernport',
  'gunnamatta': 'westernport',
  'portsea': 'port-phillip-heads',
};

/**
 * Fetch tide predictions from BOM
 * Note: BOM tide data format varies - this is a simplified implementation
 * Real implementation would need to handle BOM's specific data format
 */
export async function fetchBomTides(breakId: string): Promise<TideEvent[]> {
  const station = TIDE_STATIONS[breakId];
  if (!station) {
    console.error(`No tide station configured for break: ${breakId}`);
    return [];
  }

  // BOM tide data is typically available via specific product codes
  // This is a placeholder - actual implementation would need correct BOM endpoints
  // For MVP, we'll use WorldTides as the primary source

  console.log(`BOM tide fetch not implemented for station: ${station}`);
  return [];
}

/**
 * Parse tide data from a standard format
 */
export function parseTideData(data: unknown[]): TideEvent[] {
  const events: TideEvent[] = [];

  for (const item of data) {
    const parsed = BomTideEventSchema.safeParse(item);
    if (parsed.success) {
      events.push({
        time: new Date(parsed.data.time),
        type: parsed.data.type,
        height: parsed.data.height,
      });
    }
  }

  return events;
}
