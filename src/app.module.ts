// app.module.ts
import { Module } from '@nestjs/common';
import { 
  dwConnection, 
  realTimeConnection, 

} from './ormconfig';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { CacheModuleConfig } from './cache/cache.module';
import { JokerModule } from './jokerbackoffice/joker.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(dwConnection),
    TypeOrmModule.forRoot(realTimeConnection),
    ConfigModule.forRoot({
      isGlobal: true
    }),
    ScheduleModule.forRoot(),
    JokerModule,
    // Caches
    CacheModuleConfig,
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule {}
