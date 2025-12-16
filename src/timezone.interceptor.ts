// timezone.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class TimezoneInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const timezoneStr = 'Asia/Phnom_Penh'; // GMT+7
    return next.handle().pipe(
      map((data) => convertDateFields(data, timezoneStr)),
    );
  }
}

function convertDateFields(obj: any, timezoneStr: string): any {
  if (!obj || typeof obj !== 'object') return obj;

  if (obj instanceof Date) {
    return dayjs(obj).tz(timezoneStr).format('YYYY-MM-DD HH:mm:ss');
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => convertDateFields(item, timezoneStr));
  }

  const result: Record<string, any> = {};
  for (const key in obj) {
    result[key] = convertDateFields(obj[key], timezoneStr);
  }
  return result;
}
