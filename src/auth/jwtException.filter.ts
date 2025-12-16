import { 
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException } from '@nestjs/common';
import { Response } from 'express';

interface HttpResponse {
  url: string;
}

@Catch(HttpException)
export class JwtExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const message = this.sanitizeErrorMessage(exception.message);
    const errorData = this.getErrorData(exception);

    response
    .status(200)
    .json({
      message,
      statusCode: status,
      data: errorData,
    });
  }

  private sanitizeErrorMessage(message: string): string {
    // Sanitize the error message to prevent sensitive information from being exposed
    return message.replace(/[^a-zA-Z0-9\s]/g, '');
  }

  private getErrorData(exception: HttpException): any {
    // Add more information about the error
    const response = exception.getResponse() as HttpResponse;
    return {
      error: exception.name,
      timestamp: new Date().toISOString(),
      path: response.url,
    };
  }
}