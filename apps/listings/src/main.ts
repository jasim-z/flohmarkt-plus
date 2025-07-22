import { NestFactory } from '@nestjs/core';
import { ListingsModule } from './listings.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(ListingsModule);
  app.use(cookieParser());
  const port = process.env.PORT || 3952;
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });
  await app.listen(port);
  console.log(`Listings service is running on port ${port}`);
}
bootstrap();
