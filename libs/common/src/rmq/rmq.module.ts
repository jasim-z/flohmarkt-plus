import { DynamicModule, Module } from '@nestjs/common'
import { RmqService } from './rmq.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

interface RmqModuleOptions {
    name: string;
}

@Module({
    providers: [RmqService],
    exports: [RmqService]
})
export class RmqModule {
    static register({ name }: RmqModuleOptions): DynamicModule {
        return {
            module: RmqModule,
            imports: [ClientsModule.registerAsync([{
                name,
                useFactory: (configService: ConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [configService.get<string>('RABBIT_MQ_URI')],
                        queue: configService.get<string>(`RABBIT_MQ_${name}_QUEUE`),
                        queueOptions: {
                            durable: true,
                        },
                        prefetchCount: 10,
                        socketOptions: {
                            heartbeatIntervalInSeconds: 30,
                            reconnectTimeInSeconds: 5,
                        },
                    },
                }),
                inject: [ConfigService],
            }])],
            exports: [ClientsModule],
        }
    }
}