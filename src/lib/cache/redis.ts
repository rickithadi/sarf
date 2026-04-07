import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

/**
 * Get Redis client instance (singleton)
 */
export function getRedis(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be configured');
    }

    redis = new Redis({
      url,
      token,
    });
  }

  return redis;
}

/**
 * Cache key generators
 */
export const cacheKeys = {
  surfReport: (breakId: string) => `surf-report:${breakId}`,
  conditions: (breakId: string) => `conditions:${breakId}`,
  mapGrid: () => `map:grid`,
  tideConfidence: (breakId: string) => `tide-confidence:${breakId}`,
  surfScoreSummary: (breakId: string) => `surf-score-summary:${breakId}`,
};

/**
 * Default TTL values in seconds
 */
export const cacheTTL = {
  surfReport: 23 * 60 * 60, // 23 hours (refreshed by daily cron)
  conditions: 5 * 60, // 5 minutes
  mapGrid: 3 * 60 * 60, // 3 hours
  tideConfidence: 60 * 60, // 1 hour
  surfScoreSummary: 10 * 60,
};

/**
 * Get cached value
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis();
    const value = await redis.get<T>(key);
    return value;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

/**
 * Set cached value with TTL
 */
export async function setCached<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    const redis = getRedis();
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

/**
 * Delete cached value
 */
export async function deleteCached(key: string): Promise<void> {
  try {
    const redis = getRedis();
    await redis.del(key);
  } catch (error) {
    console.error('Redis delete error:', error);
  }
}
