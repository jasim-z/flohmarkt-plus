import { Injectable } from "@nestjs/common";
import { RmqContext, RmqOptions, Transport } from '@nestjs/microservices'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class RmqService {
    constructor(private readonly configService: ConfigService) {}

    getOptions(queue: string, noAck = false): RmqOptions {
        return {
            transport: Transport.RMQ,
            options: {
                urls: [this.configService.get<string>('RABBIT_MQ_URI')],
                queue: this.configService.get<string>(`RABBIT_MQ_${queue}_QUEUE`),
                noAck,
                queueOptions: {
                    durable: true,
                },
                prefetchCount: 10,
                persistent: true,
                socketOptions: {
                    heartbeatIntervalInSeconds: 30,
                    reconnectTimeInSeconds: 5,
                },
            },
        };
    }

    ack(context: RmqContext) {
        const channel = context.getChannelRef();
        const originalMessage = context.getMessage();
        channel.ack(originalMessage);
    }
} 