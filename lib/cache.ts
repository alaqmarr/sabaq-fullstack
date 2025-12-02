import Redis from "ioredis";

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }
  throw new Error("REDIS_URL is not defined");
};

let redis: Redis | null = null;

try {
  redis = new Redis(getRedisUrl(), {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redis.on("error", (err) => {
    console.warn("Redis connection error:", err);
  });
} catch (error) {
  console.warn("Failed to initialize Redis client:", error);
}

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;
    try {
      const data = await redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  },

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!redis) return;
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, serialized);
      } else {
        await redis.set(key, serialized);
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  },

  async del(key: string): Promise<void> {
    if (!redis) return;
    try {
      await redis.del(key);
    } catch (error) {
      console.error(`Cache del error for key ${key}:`, error);
    }
  },

  async invalidatePattern(pattern: string): Promise<void> {
    if (!redis) return;
    try {
      const stream = redis.scanStream({
        match: pattern,
        count: 100,
      });

      stream.on("data", async (keys: string[]) => {
        if (keys.length) {
          const pipeline = redis!.pipeline();
          keys.forEach((key) => {
            pipeline.del(key);
          });
          await pipeline.exec();
        }
      });

      stream.on("end", () => {
        // console.log(`Invalidated keys matching ${pattern}`);
      });
    } catch (error) {
      console.error(`Cache invalidatePattern error for ${pattern}:`, error);
    }
  },

  async ping(): Promise<boolean> {
    if (!redis) return false;
    try {
      await redis.ping();
      return true;
    } catch (error) {
      return false;
    }
  },
};
