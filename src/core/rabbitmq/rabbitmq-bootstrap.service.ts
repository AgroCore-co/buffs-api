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

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url = this.configService.get<string>('RABBITMQ_URL', RABBITMQ_DEFAULT_URL);

    try {
      const connection = await amqplib.connect(url);
      const channel = await connection.createChannel();

      // 1. Criar DLX (fanout → todas as mensagens mortas vão para a DLQ)
      await channel.assertExchange(DLX_EXCHANGE, 'fanout', { durable: true });

      // 2. Criar DLQ
      await channel.assertQueue(RabbitMQQueues.DLQ, { durable: true });

      // 3. Bind DLQ ao DLX
      await channel.bindQueue(RabbitMQQueues.DLQ, DLX_EXCHANGE, '');

      this.logger.log('📦 DLX + DLQ configurados com sucesso');

      await channel.close();
      await connection.close();
    } catch (error) {
      // Não-crítico: sistema funciona sem DLQ, apenas perde mensagens falhadas
      this.logger.warn(`⚠️ Falha ao configurar DLX/DLQ (não-crítico): ${error instanceof Error ? error.message : error}`);
    }
  }
}
