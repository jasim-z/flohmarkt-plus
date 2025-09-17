import { NestFactory } from '@nestjs/core';
import { OrdersModule } from './orders.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(OrdersModule);
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
  }));
  const configService = app.get(ConfigService);
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });
  await app.listen(configService.get('PORT'));
}
bootstrap();
