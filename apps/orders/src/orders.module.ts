import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import * as Joi from 'joi';
import { DatabaseModule, RmqModule, JwtStrategy, RolesGuard, HealthController, MetricsService, MetricsMiddleware, CorrelationMiddleware } from '@app/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schemas';
import { OrdersRepository } from './orders.repository';
import { BILLING_SERVICE } from './constants/services';
import { SanitizationMiddleware } from './middleware/sanitization.middleware';
import { RateLimitMiddleware, RATE_LIMITS } from './middleware/rate-limit.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        PORT: Joi.number().required(),
      }),
      envFilePath: './apps/orders/.env',
    }),
    DatabaseModule,
    PassportModule,
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    RmqModule.register({
      name: BILLING_SERVICE,
    }),
  ],
  controllers: [OrdersController, HealthController],
  providers: [OrdersService, OrdersRepository, JwtStrategy, RolesGuard, MetricsService],
})
export class OrdersModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Correlation and metrics on all routes
    consumer
      .apply(CorrelationMiddleware, MetricsMiddleware)
      .forRoutes('*');

    consumer.apply(SanitizationMiddleware).forRoutes('*');
    consumer.apply(RateLimitMiddleware.create(RATE_LIMITS.GENERAL)).forRoutes('*');
    consumer.apply(RateLimitMiddleware.create(RATE_LIMITS.CREATE)).forRoutes('POST /orders');
  }
}
