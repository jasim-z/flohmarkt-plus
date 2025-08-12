import { NestFactory } from '@nestjs/core';
import { MarketsModule } from './markets.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(MarketsModule);
  app.use(cookieParser());
  const port = process.env.PORT || 3953;
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });
  await app.listen(port);
  console.log(`Markets service is running on port ${port}`);
}
bootstrap(); 