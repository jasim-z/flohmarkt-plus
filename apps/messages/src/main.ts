import { NestFactory } from '@nestjs/core';
import { MessagesModule } from './messages.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(MessagesModule);
  app.use(cookieParser());
  const port = process.env.PORT || 3954;
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });
  await app.listen(port);
  console.log(`Messages service is running on port ${port}`);
}
bootstrap();

