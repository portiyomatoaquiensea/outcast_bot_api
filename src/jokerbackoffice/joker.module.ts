import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStrategy } from '../auth/local.strategy';
import { JokerController } from './joker.controller';
import { JwtOptionsFactor } from '../auth/jwtOptions.factory';
import { JwtExceptionFilter } from '../auth/jwtException.filter';
import { JokerService } from './joker.service';

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
    JokerController,
  ],
  providers: [
    LocalStrategy,
    JwtExceptionFilter,
    JokerService
  ],
  exports: [],
})
export class JokerModule {}
