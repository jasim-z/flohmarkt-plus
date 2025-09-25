import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { DatabaseModule, JwtStrategy, RolesGuard, HealthController, MetricsService, MetricsMiddleware, CorrelationMiddleware } from '@app/common';
import { loadConfig } from '@app/common/config/config';
import { MessagesController } from './messages.controller';
import { ConversationsController } from './conversations.controller';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { JwtModule } from '@nestjs/jwt';
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
    }),
    DatabaseModule,
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  controllers: [MessagesController, ConversationsController, HealthController],
  providers: [MessagesService, JwtStrategy, RolesGuard, MessagesGateway, MetricsService],
})
export class MessagesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Correlation and metrics on all routes
    consumer
      .apply(CorrelationMiddleware, MetricsMiddleware)
      .forRoutes('*');

    consumer.apply(SanitizationMiddleware).forRoutes('*');
    consumer.apply(RateLimitMiddleware.create(RATE_LIMITS.GENERAL)).forRoutes('*');
    consumer.apply(RateLimitMiddleware.create(RATE_LIMITS.SEND)).forRoutes('POST /conversations/:conversationId/messages');
    consumer.apply(RateLimitMiddleware.create(RATE_LIMITS.CONV_CREATE)).forRoutes('POST /conversations');
  }
}

