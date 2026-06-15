import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  // Exponential backoff up to 2s — stops retrying after 10 attempts
  retryStrategy(times) {
    if (times > 10) {
      console.warn('[Redis] Not available. Caching disabled — server continues without Redis.');
      return null; // Stop retrying
    }
    return Math.min(times * 200, 2000);
  },
  // Suppress connection errors from crashing the process
  lazyConnect: true,
  enableOfflineQueue: false,
});

redisClient.on('connect', () => {
  console.log('[Redis] Connected successfully.');
});

redisClient.on('error', (err) => {
  // Only log once — not on every retry
  if (err.code === 'ECONNREFUSED') {
    // Already handled by retryStrategy
    return;
  }
  console.error('[Redis] Error:', err.message);
});

// Attempt connection (lazyConnect means it won't auto-connect on init)
redisClient.connect().catch(() => {
  // Silently fail — retryStrategy handles the retry/stop logic
});

export default redisClient;
