import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as express from 'express';
import * as path from 'path';
import { TimezoneInterceptor } from './timezone.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));
  app.useGlobalInterceptors(new TimezoneInterceptor());
  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Wooden Snake')
    .setDescription('Wooden Snake Api Document')
    .setVersion('1.0')
    .addBearerAuth({ 
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // Serve Swagger UI assets 
  app.use('/api-docs', express.static(path.join(__dirname, '..', 'public', 'swagger')));
  app.enableCors();
  await app.listen(8000);
}
bootstrap();
