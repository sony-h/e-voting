import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(config: ConfigService) {
    this.client = new Redis(
      config.get<string>('REDIS_URL') ?? 'redis://localhost:6379',
      {
        retryStrategy: (times) => {
          return Math.min(times * 500, 30000);
        },
        maxRetriesPerRequest: 2,
      },
    );

    this.client.on('connect', () => {
      this.logger.log('Cache connected');
    });
    this.client.on('error', (error) => {
      this.logger.warn(`Cache connection error: ${error.message}`);
    });
  }

  async ping(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async setex(key: string, ttlSeconds: number, value: string): Promise<void> {
    await this.client.setex(key, ttlSeconds, value);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
