import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        exchanges: [
          // Domain events — async fire-and-forget
          {
            name: 'auth.events',
            type: 'topic',
          },
          // RPC — synchronous request/reply from other microservices
          {
            name: 'auth.rpc',
            type: 'direct',
          },
          // Dead-letter exchange — receives nacked/expired RPC messages
          {
            name: 'auth.rpc.dlx',
            type: 'direct',
          },
        ],
        // queues: [
        //   {
        //     name: 'auth.validate_token_queue',
        //     options: {
        //       durable: true,
        //       arguments: {
        //         'x-dead-letter-exchange': 'auth.rpc.dlx',
        //         'x-dead-letter-routing-key': 'auth.validate_token_queue.dead',
        //         'x-max-length': 10_000,
        //         'x-overflow': 'reject-publish',
        //       },
        //     },
        //   },
        // ],
        uri: config.get<string>('rabbitmq.url')!,
        connectionInitOptions: { wait: false },
        enableControllerDiscovery: true,
      }),
    }),
  ],
  exports: [RabbitMQModule],
})
export class MessageModule {}
