import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RABBITMQ_SERVICE } from 'src/core/rabbitmq/rabbitmq.constants';

/**
 * Health indicator simples para RabbitMQ.
 * Usa o ClientProxy nativo do @nestjs/microservices.
 */
@Injectable()
export class RabbitMQHealthIndicator {
  private readonly logger = new Logger(RabbitMQHealthIndicator.name);

  constructor(@Inject(RABBITMQ_SERVICE) private readonly rmqClient: ClientProxy) {}

  async check(): Promise<RabbitMQHealthResult> {
    try {
      await this.rmqClient.connect();
      return {
        status: 'up',
        connected: true,
        message: 'RabbitMQ operacional',
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`RabbitMQ health check falhou: ${msg}`);
      return {
        status: 'down',
        connected: false,
        message: 'RabbitMQ não está conectado',
      };
    }
  }
}

export interface RabbitMQHealthResult {
  status: 'up' | 'down';
  connected: boolean;
  message: string;
}
