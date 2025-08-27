import { createClient, type RedisClientType } from "redis";
import { REDIS_URL } from "../constants";

export const redis: RedisClientType = createClient({ url: REDIS_URL });

export async function connectRedis(): Promise<void> {
  if (redis.isOpen) {
    return;
  }

  await redis.connect();
}

export async function disconnectRedis(): Promise<void> {
  if (redis.isOpen) {
    await redis.quit();
  }
}
