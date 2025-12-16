// cache.module.ts
import * as dotenv from 'dotenv';
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisStore } from './redis.store';

dotenv.config();
@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      store: new RedisStore(process.env.KV_URL),
    }),
  ],
})
export class CacheModuleConfig {}