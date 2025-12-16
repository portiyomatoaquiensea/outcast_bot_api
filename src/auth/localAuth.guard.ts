
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtExceptionFilter } from './jwtException.filter';

@Injectable()
export class LocalAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly jwtExceptionFilter: JwtExceptionFilter,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
  
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      this.jwtExceptionFilter.catch(new UnauthorizedException('Access token is missing'), context);
      return false;
    }
    try {
      const secret = this.configService.get<string>('LOCAL_SECRET');
      if (secret == token) {
          return true;
      }
    } catch (error) {
      this.jwtExceptionFilter.catch(new UnauthorizedException('Invalid access token'), context);
      return false;
    }
    return false;
  }
}
