import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';
import { DLX_EXCHANGE, RabbitMQQueues, RABBITMQ_DEFAULT_URL } from './rabbitmq.constants';

/**
 * Serviço de bootstrap que cria a infraestrutura de DLX/DLQ na inicialização.
 *
 * Usa uma conexão temporária via amqplib para criar:
 * - Exchange DLX (Dead Letter Exchange) do tipo fanout
 * - Queue DLQ (Dead Letter Queue) vinculada ao DLX
 *
 * Após criar, fecha a conexão. É executado apenas uma vez no startup.
 */
@Injectable()
export class RabbitMQBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQBootstrapService.name);
  private static readonly MAX_RETRIES = 3;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url = this.configService.get<string>('RABBITMQ_URL', RABBITMQ_DEFAULT_URL);

    for (let attempt = 1; attempt <= RabbitMQBootstrapService.MAX_RETRIES; attempt++) {
      try {
        const connection = await amqplib.connect(url);
        const channel = await connection.createChannel();

        // 1. Criar DLX (fanout -> todas as mensagens mortas vao para a DLQ)
        await channel.assertExchange(DLX_EXCHANGE, 'fanout', { durable: true });

        // 2. Criar DLQ
        await channel.assertQueue(RabbitMQQueues.DLQ, { durable: true });

        // 3. Bind DLQ ao DLX
        await channel.bindQueue(RabbitMQQueues.DLQ, DLX_EXCHANGE, '');

        this.logger.log('DLX + DLQ configurados com sucesso');

        await channel.close();
        await connection.close();
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        if (attempt === RabbitMQBootstrapService.MAX_RETRIES) {
          this.logger.error(
            `DLX/DLQ nao configurados apos ${RabbitMQBootstrapService.MAX_RETRIES} tentativas. Mensagens falhadas podem ser descartadas. Motivo: ${message}`,
          );
          return;
        }

        this.logger.warn(`Falha ao configurar DLX/DLQ (tentativa ${attempt}/${RabbitMQBootstrapService.MAX_RETRIES}): ${message}`);
        await this.delay(1000 * attempt);
      }
    }
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
