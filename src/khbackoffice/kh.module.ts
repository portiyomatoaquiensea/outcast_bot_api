import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStrategy } from '../auth/local.strategy';
import { KhController } from './kh.controller';
import { JwtOptionsFactor } from '../auth/jwtOptions.factory';
import { JwtExceptionFilter } from '../auth/jwtException.filter';
import { KhService } from './kh.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useClass: JwtOptionsFactor,
      inject: [ConfigService],
    }),
  ],
  controllers: [
    KhController,
  ],
  providers: [
    LocalStrategy,
    JwtExceptionFilter,
    KhService
  ],
  exports: [],
})
export class KhModule {}
