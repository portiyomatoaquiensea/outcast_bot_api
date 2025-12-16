import * as Redis from 'redis';
import * as dotenv from 'dotenv';
import { CacheStore } from '@nestjs/cache-manager';

dotenv.config();
export class RedisStore implements CacheStore {
  private client: Redis.RedisClientType;

  constructor(private readonly url: string) {
    this.client = Redis.createClient({ url, socket: { tls: process.env.KV_TLS === 'true' } });
    this.client.on('error', (err) => console.log('Redis Client Error', err));
    this.client.connect();
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set<T>(key: string, value: T, options: number): Promise<void> {
    const ttl = options && typeof options === 'number' ? options : 0;
    const stringValue = JSON.stringify(value);
    await this.client.set(key, stringValue, { EX: ttl });
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

}

