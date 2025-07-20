import { NestFactory } from '@nestjs/core';
import { ListingsModule } from './listings.module';

async function bootstrap() {
  const app = await NestFactory.create(ListingsModule);
  const port = process.env.PORT || 3952;
  await app.listen(port);
  console.log(`Listings service is running on port ${port}`);
}
bootstrap();
