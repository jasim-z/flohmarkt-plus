import { NestFactory } from "@nestjs/core";
import { AuthModule } from "./auth.module";
import { RmqService } from "@app/common";
import { RmqOptions } from "@nestjs/microservices";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  app.use(cookieParser());
  const rmqService = app.get<RmqService>(RmqService);
  app.connectMicroservice<RmqOptions>(rmqService.getOptions('AUTH', true));
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
  }));
  const configService = app.get(ConfigService);
  await app.startAllMicroservices();
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });
  await app.listen(configService.get('AUTH_SERVICE_PORT'));
}
bootstrap();
