import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RABBITMQ_SERVICE, RabbitMQQueues, DLX_EXCHANGE, RABBITMQ_DEFAULT_URL } from './rabbitmq.constants';
import { RabbitMQBootstrapService } from './rabbitmq-bootstrap.service';

/**
 * Módulo central do RabbitMQ.
 *
 * Exporta um ClientProxy (token RABBITMQ_SERVICE) para publicação de mensagens.
 * O bootstrap service cria a DLX + DLQ na inicialização.
 *
 * Uso:
 *   @Inject(RABBITMQ_SERVICE) private readonly rmqClient: ClientProxy
 *   this.rmqClient.emit('alerta_criado', payload)
 */
@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: RABBITMQ_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URL', RABBITMQ_DEFAULT_URL)],
            queue: RabbitMQQueues.ALERTS,
            queueOptions: {
              durable: true,
              arguments: {
                'x-dead-letter-exchange': DLX_EXCHANGE,
              },
            },
            persistent: true,
          },
        }),
      },
    ]),
  ],
  providers: [RabbitMQBootstrapService],
  exports: [ClientsModule],
})
export class RabbitMQModule {}
