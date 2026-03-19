import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class DistributedLockService {
  constructor(@Inject('REDIS') private redis: Redis) { }

  async acquireLock(key: string, ttl: number = 30000): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const result = await this.redis.set(lockKey, '1', 'PX', ttl, 'NX');
    return result === 'OK';
  }

  async releaseLock(key: string): Promise<void> {
    const lockKey = `lock:${key}`;
    await this.redis.del(lockKey);
  }

  async withLock<T>(
    key: string,
    callback: () => Promise<T>,
    ttl: number = 30000
  ): Promise<T> {
    const acquired = await this.acquireLock(key, ttl);
    if (!acquired) {
      throw new Error(`Could not acquire lock for ${key}`);
    }

    try {
      return await callback();
    } finally {
      await this.releaseLock(key);
    }
  }

  async extendLock(key: string, ttl: number = 30000): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const result = await this.redis.expire(lockKey, ttl);
    return result === 1;
  }

  async isLocked(key: string): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const exists = await this.redis.exists(lockKey);
    return exists === 1;
  }
}
