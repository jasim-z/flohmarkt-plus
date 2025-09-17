import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { RmqModule } from '@app/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { SanitizationMiddleware } from './middleware/sanitization.middleware';
import { RateLimitMiddleware, RATE_LIMITS } from './middleware/rate-limit.middleware';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    validationSchema: Joi.object({
      RABBIT_MQ_URI: Joi.string().required(),
      RABBIT_MQ_BILLING_QUEUE: Joi.string().required(),
    })
  }),
  RmqModule],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SanitizationMiddleware).forRoutes('*');
    consumer.apply(RateLimitMiddleware.create(RATE_LIMITS.GENERAL)).forRoutes('*');
  }
}
