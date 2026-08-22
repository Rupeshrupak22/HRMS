/**
 * Redis client stub — in-memory fallback for distributed rate limiting.
 */
export function getRedisClient(): null {
  return null;
}

export function isRedisAvailable(): boolean {
  return false;
}
