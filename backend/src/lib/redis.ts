import Redis from 'ioredis';
import { env } from './env';

/**
 * Redis client for rate limiting and session management.
 * Gracefully falls back to in-memory if Redis is unavailable.
 */
let redisClient: Redis | null = null;
let redisAvailable = false;

export function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 3) return null; // Stop retrying after 3 attempts
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    redisClient.on('connect', () => {
      redisAvailable = true;
      console.log('✅ Redis connected for rate limiting');
    });

    redisClient.on('error', (err) => {
      redisAvailable = false;
      if (err.message?.includes('ECONNREFUSED')) {
        // Silent — Redis is optional, falls back to in-memory
      } else {
        console.warn('⚠️  Redis error:', err.message);
      }
    });

    redisClient.on('close', () => {
      redisAvailable = false;
    });

    // Attempt connection
    redisClient.connect().catch(() => {
      redisAvailable = false;
    });

    return redisClient;
  } catch {
    return null;
  }
}

export function isRedisAvailable(): boolean {
  return redisAvailable;
}
