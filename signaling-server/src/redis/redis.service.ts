import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  onModuleInit() {
    // this.client = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async addToStream(streamKey: string, event: Record<string, any>) {
    const flattened: string[] = [];
    for (const [k, v] of Object.entries(event)) {
      flattened.push(k, typeof v === 'string' ? v : JSON.stringify(v));
    }
    return this.client.xadd(streamKey, 'MAXLEN', '~', 10000, '*', ...flattened);
  }
}
